import chalk from "chalk";
import inquirer from "inquirer"
import { addTaskToProject, getTasksInProject, type TaskInfo } from "../clients/todoist";
import { readConfig, type UserConfig } from "./configService";
import CliTable3 from "cli-table3";
import { randomUUIDv7 } from "bun";

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
    addTaskToProject(title, description, 4, config.defaultProjectId!, config.defaultSectionId!);
}

export const viewTasksInTodoistProject = async () => {
    const config: UserConfig = readConfig();
    const tasks: TaskInfo[] = await getTasksInProject(config.defaultProjectId!);

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
            const task = sectionTaskMap[section.id]![row];
            if (!task) return ""; // Empty cell
            return `${task.content}${task.checked === "1" ? chalk.green(" ✓") : ""}`;
        });
        table.push(rowData);
    }

    console.log(table.toString());

}

export const createStandupSummary = async () => {
    /*
        1. Get the tasks that are in Done status or last section_order.
        2. Get the tasks that are in completed activity.
        3. Get the tasks priority tasks in the middle sections (TODO or IN Progress generally)
        
        4. Get all these with labels and feed it to the AI and get the output.
    */
    console.log("Coming soon...")
}
