import { fetch } from "bun"
import chalk from "chalk";

const TODOIST_BASE_URL = "https://api.todoist.com/api/v1"

export interface ProjectInfo {
    id: string,
    name: string,
    color: string
}

export interface ProjectResponse {
    results: ProjectInfo[]
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
    }

    const data = await response.json() as ProjectResponse;
    return data.results
}