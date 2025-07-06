import { fetch } from "bun"
import chalk from "chalk";
import { readConfig, type UserConfig } from "../services/configService";

const TODOIST_BASE_URL = "https://api.todoist.com/api/v1"
const TODOIST_SYNC_URL = "https://api.todoist.com/sync/v9"

export interface ProjectInfo {
    id: string,
    name: string,
    color: string
}

export interface ProjectResponse {
    results: ProjectInfo[]
}

export interface SectionInfo {
    id: string,
    name: string,
    section_order: number
}

export interface SectionResponse {
    results: SectionInfo[]
}

export interface TaskInfo {
    id: string,
    section_id: string,
    checked: string,
    content: string,
    description: string,
    labels?: string[],
}

export interface ViewTaskResponse {
    results: TaskInfo[]
}

export interface ActivityItem {
    id: string;
    object_id: string;
    object_type: string;
    event_type: string;
    event_date: string;
    parent_project_id: string;
    parent_item_id?: string;
    extra_data?: {
        content?: string;
        description?: string;
        labels?: string[];
    };
}

export interface ActivityResponse {
    count: number;
    events: ActivityItem[];
}


export const getProjects = async (todoistToken: string): Promise<ProjectInfo[]> => {
    console.log(chalk.cyan("Fetch projects info from todoist...\n"))
    const response = await fetch(`${TODOIST_BASE_URL}/projects`, {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${todoistToken}`
        }
    });

    if (!response.ok) {
        console.error(chalk.red("Could not fetch data from Todoist"));
        throw new Error(`Failed to fetch projects: ${response.status} ${response.statusText}`);
    }
    let data: ProjectResponse;
    try {
        data = await response.json() as ProjectResponse;
    } catch (error) {
        throw new Error(`Failed to parse response: ${error}`);
    }
    return data.results
}

export const getSections = async (todoistToken: string, projectId: string): Promise<SectionInfo[]> => {
    console.log(chalk.cyan("Fetch sections info from todoist...\n"))
    const response = await fetch(`${TODOIST_BASE_URL}/sections?project_id=${projectId}`, {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${todoistToken}`
        }
    });

    if (!response.ok) {
        console.error(chalk.red("Could not fetch data from Todoist"));
        throw new Error(`Failed to fetch sections: ${response.status} ${response.statusText}`);
    }
    let data: SectionResponse;
    try {
        data = await response.json() as SectionResponse;
    } catch (error) {
        throw new Error(`Failed to parse response: ${error}`);
    }
    return data.results

}

export const addTaskToProject = async (
    title: string,
    description: string,
    priority: number,
    projectId: string,
    sectionId: string
) => {
    console.log(chalk.gray("Adding task to project"));
    const config: UserConfig = readConfig();
    const request = {
        content: title,
        description: description,
        project_id: projectId,
        priority: priority,
        section_id: sectionId
    }

    const response = await fetch(`${TODOIST_BASE_URL}/tasks`, {
        method: "POST",
        body: JSON.stringify(request),
        headers: {
            "Authorization": `Bearer ${config.todoistToken}`,
            "Content-Type": "application/json"
        }
    })

    if (response.ok) {
        console.log(chalk.green("Task added to the project"));
    } else {
        console.log(chalk.red("Adding task failed"));
        const data = await response.json();
        console.log(data)
    }
}

export const getTasksInProject = async (
    project_id: string,
): Promise<TaskInfo[]> => {
    const config: UserConfig = readConfig();
    // Add labels parameter to get labels for each task
    const response = await fetch(`${TODOIST_BASE_URL}/tasks?project_id=${project_id}`, {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${config.todoistToken}`,
        }
    })

    if (!response.ok) {
        console.error(chalk.red("Could not fetch data from Todoist"));
        throw new Error(`Failed to fetch tasks: ${response.status} ${response.statusText}`);
    }

    let data: ViewTaskResponse;
    try {
        data = await response.json() as ViewTaskResponse;
    } catch (error) {
        throw new Error(`Failed to parse response: ${error}`);
    }
    return data.results
}

export const getActivityForProject = async (
    project_id: string,
    since?: Date
): Promise<ActivityItem[]> => {
    console.log(chalk.cyan("Fetching activity data from Todoist..."));
    const config: UserConfig = readConfig();

    // Calculate the date for yesterday if not provided
    if (!since) {
        since = new Date();
        since.setDate(since.getDate() - 1);
    }

    // Format date as YYYY-MM-DD
    const sinceFormatted = since.toISOString().split('T')[0];

    const response = await fetch(`${TODOIST_SYNC_URL}/activity/get`, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${config.todoistToken}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            parent_project_id: project_id,
            since: sinceFormatted,
            limit: 100
        })
    });

    if (!response.ok) {
        console.error(chalk.red("Could not fetch activity data from Todoist"));
        throw new Error(`Failed to fetch activity: ${response.status} ${response.statusText}`);
    }

    let data: ActivityResponse;
    try {
        data = await response.json() as ActivityResponse;
    } catch (error) {
        throw new Error(`Failed to parse activity response: ${error}`);
    }

    return data.events;
}
