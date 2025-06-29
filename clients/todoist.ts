import { fetch } from "bun"
import chalk from "chalk";
import { readConfig, type UserConfig } from "../services/configService";

const TODOIST_BASE_URL = "https://api.todoist.com/api/v1"

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
}

export interface ViewTaskResponse {
    results: TaskInfo[]
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

