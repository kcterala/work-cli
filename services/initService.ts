import chalk from "chalk";
import { getProjects, getSections, type ProjectInfo, type SectionInfo } from "../clients/todoist";
import inquirer from "inquirer";
import { readConfig, updateConfigValue, type UserConfig } from "./configService";

export const initialize = async (): Promise<UserConfig> => {

    const todoistToken = await getTodoistTokenFromUser();
    const defaultProjectId = await getDefaultProjectIdFromUser(todoistToken);
    const llmToken = await getLLMTokenFromUser();
    const defaultSectionId = await getDefaultSectionIdFromUser(todoistToken, defaultProjectId);

    return { todoistToken, defaultProjectId, llmToken, defaultSectionId }
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

const getDefaultSectionIdFromUser = async (todoistToken: string, projectId: string): Promise<string> => {

    const config = readConfig();
    if (config.defaultSectionId) {
        return config.defaultSectionId;
    }

    const sections: SectionInfo[] = await getSections(todoistToken, projectId);
    console.log(chalk.green(`Found ${sections.length} Sections`))
    const { sectionId } = await inquirer.prompt([
        {
            type: "list",
            name: "sectionId",
            message: "Select a default section of the project to add a task:",
            choices: sections.map(section => ({
                name: section.name,
                value: section.id,
            }))
        }
    ]);

    updateConfigValue("defaultSectionId", sectionId);
    updateConfigValue("sections", sections)
    return sectionId;
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
        updateConfigValue('llmToken', "not-provided");
    }

    return trimmedToken;

}