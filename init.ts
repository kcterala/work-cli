import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import chalk from "chalk";
import { CONFIG_DIR } from "./constants";
import { CONFIG_PATH } from "./constants";
import { getProjects, type ProjectInfo } from "./resources/todoist";
import inquirer from "inquirer";
import { readConfig, updateConfigValue } from "./config-manager";

export interface UserConfig {
    todoistToken?: string,
    defaultProjectId?: string,
    llmToken?: string
}

export const initialize = async (): Promise<UserConfig> => {

    const todoistToken = await getTodoistTokenFromUser();
    const defaultProjectId = await getDefaultProjectIdFromUser(todoistToken);
    const llmToken = await getLLMTokenFromUser();

    return { todoistToken, defaultProjectId, llmToken }
}

const getTodoistTokenFromUser = async (): Promise<string> => {
    const config: UserConfig = readConfig();
    if (config.todoistToken) {
        return config.todoistToken;
    }

    const { todoistToken } = await inquirer.prompt([
        {
            type: "input",
            name: "todoistToken",
            message: chalk.cyan("Enter your Todoist API token: [Open settings => Integrations => Developer] : "),
            validate: (input: string) => {
                if (!input?.trim()) {
                    return "Token input is required.";
                }
                return true;
            }
        }
    ])
    const token = todoistToken.trim();
    updateConfigValue("todoistToken", token)
    return token;
}



const getDefaultProjectIdFromUser = async (todoistToken: string): Promise<string> => {
    try {
        const config = readConfig();
        if (config.defaultProjectId) {
            return config.defaultProjectId;
        }

        const projects: ProjectInfo[] = await getProjects(todoistToken);
        console.log(chalk.green(`Found ${projects.length} Projects`))
        const { projectId } = await inquirer.prompt([
            {
                type: "list",
                name: "projectId",
                message: "Select a Todoist project to use for standup summarization:",
                choices: projects.map(project => ({
                    name: project.name,
                    value: project.id,
                }))
            }
        ]);

        updateConfigValue("defaultProjectId", projectId);
        return projectId;
    } catch (error) {
        console.error(chalk.red("Error fetching projects:"), error);
        process.exit(1)
    }
}

const getLLMTokenFromUser = async (): Promise<string> => {
    const config = readConfig();
    if (config.llmToken) {
        return config.llmToken;
    }

    const { token } = await inquirer.prompt([
        {
            type: "input",
            name: "token",
            message: chalk.cyan("Enter your LLM API token (optional):"),
        }
    ]);


    const trimmedToken = token.trim();
    if (trimmedToken) {
        updateConfigValue('llmToken', trimmedToken);
    } else {
        updateConfigValue('llmToken', "dont-ask");
    }

    return trimmedToken;

}