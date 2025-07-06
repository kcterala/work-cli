import chalk from "chalk";
import inquirer from "inquirer"
import {
    addTaskToProject,
    getTasksInProject,
    getActivityForProject,
    type TaskInfo,
    type ActivityItem
} from "../clients/todoist";
import { readConfig, type UserConfig } from "./configService";
import CliTable3 from "cli-table3";
import { randomUUIDv7 } from "bun";
import { generateStandupSummary, type TaskSummaryInput } from "./aiService";

export const addTaskToTodoistProject = async () => {
    const title: string = (await inquirer.prompt([
        {
            type: "input",
            name: "content",
            message: chalk.white("Enter Title"),
            validate: (input: string) => {
                if (!input?.trim()) {
                    return "Title is required";
                }
                return true;
            }
        }
    ])).content as string;

    const description: string = (await inquirer.prompt([
        {
            type: "input",
            name: "description",
            message: chalk.white("Enter Description (Optional)")
        }
    ])).description as string;

    const config: UserConfig = readConfig();

    if (!config.defaultProjectId || !config.defaultSectionId) {
        console.error(chalk.red("No default project or section configured. Please run setup first."));
        return;
    }

    // Default priority is 4 (normal)
    const priority = 4;
    addTaskToProject(title, description, priority, config.defaultProjectId, config.defaultSectionId);
}

export const viewTasksInTodoistProject = async () => {
    const config: UserConfig = readConfig();

    if (!config.defaultProjectId) {
        console.error(chalk.red("No default project configured. Please run setup first."));
        return;
    }

    const tasks: TaskInfo[] = await getTasksInProject(config.defaultProjectId);

    // Check if sections exist and are available
    if (!config.sections || config.sections.length === 0) {
        // Render simple single-column table
        const table = new CliTable3({
            head: [chalk.bold('Tasks')],
            colWidths: [50],
            wordWrap: true
        });

        for (const task of tasks) {
            table.push([`${task.content}${task.checked === "1" ? chalk.green(" ✓") : ""}`]);
        }

        console.log(table.toString());
        return;
    }

    const sectionsSorted = [...config.sections!].sort((a, b) => a.section_order - b.section_order);

    const sectionTaskMap: Record<string, TaskInfo[]> = {};
    for (const section of sectionsSorted) {
        sectionTaskMap[section.id] = [];
    }

    for (const task of tasks) {
        if (sectionTaskMap[task.section_id]) {
            sectionTaskMap[task.section_id]!.push(task);
        }
    }

    // Determine max number of rows needed (i.e. max tasks in any section)
    const maxRows = Math.max(...Object.values(sectionTaskMap).map(tasks => tasks.length));

    // Build table
    const table = new CliTable3({
        head: sectionsSorted.map(sec => chalk.bold(sec.name)),
        colWidths: new Array(sectionsSorted.length).fill(25),
        wordWrap: true
    });

    for (let row = 0; row < maxRows; row++) {
        const rowData = sectionsSorted.map(section => {
            const tasks = sectionTaskMap[section.id] || [];
            const task = tasks[row];
            if (!task) return ""; // Empty cell
            return `${task.content}${task.checked === "1" ? chalk.green(" ✓") : ""}`;
        });
        table.push(rowData);
    }

    console.log(table.toString());

}

export const createStandupSummary = async () => {
    console.log(chalk.cyan("Generating standup summary..."));

    // Get configuration and tasks
    const config: UserConfig = readConfig();
    if (!config.defaultProjectId) {
        console.error(chalk.red("No default project configured. Please run setup first."));
        return;
    }

    // Get all tasks from the project
    const tasks: TaskInfo[] = await getTasksInProject(config.defaultProjectId);
    console.log(chalk.cyan(`Found ${tasks.length} tasks in the project`));

    // Check if sections exist
    if (!config.sections || config.sections.length === 0) {
        console.error(chalk.red("No sections found in the project. Please run setup first."));
        return;
    }

    // Sort sections by order
    const sectionsSorted = [...config.sections].sort((a, b) => a.section_order - b.section_order);

    // Group tasks by section
    const sectionTaskMap: Record<string, TaskInfo[]> = {};
    for (const section of sectionsSorted) {
        sectionTaskMap[section.id] = [];
    }

    for (const task of tasks) {
        if (task.section_id) {
            if (!sectionTaskMap[task.section_id]) {
                sectionTaskMap[task.section_id] = [];
            }
            sectionTaskMap[task.section_id]!.push(task);
        }
    }


    // Prepare data for AI summary
    const summaryInput: TaskSummaryInput = {
        completedTasks: [],
        inProgressTasks: [],
        priorityTasks: []
    };

    // Get activity data for the last day to find completed tasks
    try {
        const activityEvents = await getActivityForProject(config.defaultProjectId);

        // Filter for completed tasks (completed events with object_type item)
        const completedTaskEvents = activityEvents.filter(event =>
            event.event_type === 'completed' &&
            event.object_type === 'item'
        );

        // Add completed tasks from activity to the summary
        if (completedTaskEvents.length > 0) {
            console.log(chalk.cyan(`Found ${completedTaskEvents.length} tasks completed in the last day`));

            // Map activity events to task format
            const completedTasksFromActivity = completedTaskEvents.map(event => ({
                content: event.extra_data?.content || `Task ${event.object_id}`,
                description: event.extra_data?.description || '',
                labels: event.extra_data?.labels || []
            }));

            // Add to completed tasks
            summaryInput.completedTasks.push(...completedTasksFromActivity);
        }
    } catch (error) {
        console.error(chalk.yellow("Could not fetch activity data:"), error);
        console.log(chalk.yellow("Continuing with tasks from sections only..."));
    }

    // 1. Get tasks from the Done status (last section) and Done but review once (second to last section)
    if (sectionsSorted.length >= 1) {
        // Last section (Done)
        const doneSection = sectionsSorted[sectionsSorted.length - 1];
        if (doneSection && doneSection.id) {
            const doneTasks = sectionTaskMap[doneSection.id] || [];
            // Add completed tasks to the summary
            summaryInput.completedTasks.push(
                ...doneTasks.map(task => ({
                    content: task.content,
                    description: task.description,
                    labels: task.labels
                }))
            );
        }




        // If there's a "Done, but review once" section (second to last)
        if (sectionsSorted.length >= 2) {
            const reviewSection = sectionsSorted[sectionsSorted.length - 2];
            if (reviewSection && reviewSection.id) {
                const reviewTasks = sectionTaskMap[reviewSection.id] || [];

                // Add review tasks to completed tasks
                summaryInput.completedTasks.push(
                    ...reviewTasks.map(task => ({
                        content: task.content,
                        description: task.description,
                        labels: task.labels
                    }))
                );
            }

        }
    }

    // 2. Get tasks from In Progress (second section)
    if (sectionsSorted.length >= 2) {
        const inProgressSection = sectionsSorted[1]; // Assuming In Progress is the second section
        if (inProgressSection && inProgressSection.id) {
            const inProgressTasks = sectionTaskMap[inProgressSection.id] || [];

            summaryInput.inProgressTasks.push(
                ...inProgressTasks.map(task => ({
                    content: task.content,
                    description: task.description,
                    labels: task.labels
                }))
            );
        }

    }

    // 3. Get priority tasks from TODO (first section)
    if (sectionsSorted.length >= 1) {
        const todoSection = sectionsSorted[0]; // Assuming TODO is the first section
        if (todoSection && todoSection.id) {
            const todoTasks = sectionTaskMap[todoSection.id] || [];

            // Consider all TODO tasks as priority for now
            summaryInput.priorityTasks.push(
                ...todoTasks.map(task => ({
                    content: task.content,
                    description: task.description,
                    labels: task.labels
                }))
            );
        }

    }

    // 4. Generate summary using AI
    try {
        const summary = await generateStandupSummary(summaryInput);
        console.log("\n" + chalk.green("Standup Summary:"));
        console.log(chalk.white(summary));
    } catch (error) {
        console.error(chalk.red("Failed to generate standup summary:"), error);
    }
}
