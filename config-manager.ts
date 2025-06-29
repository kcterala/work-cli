import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { CONFIG_DIR, CONFIG_PATH } from "./constants";

export interface UserConfig {
    todoistToken?: string,
    defaultProjectId?: string,
    llmToken?: string
}

export const createConfigFileIfRequired = (): void => {
    if (existsSync(CONFIG_PATH)) {
        return;
    }

    mkdirSync(CONFIG_DIR, { recursive: true });
    const config: UserConfig = {}
    writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
}

export const readConfig = (): UserConfig => {
    createConfigFileIfRequired();
    try {
        const configData = readFileSync(CONFIG_PATH, 'utf8');
        return JSON.parse(configData);
    } catch (error) {
        console.error('Error reading config file:', error);
        return {};
    }
}

export const updateConfig = (updates: Partial<UserConfig>): void => {
    try {
        const currentConfig = readConfig();
        const updatedConfig = { ...currentConfig, ...updates };
        writeFileSync(CONFIG_PATH, JSON.stringify(updatedConfig, null, 2));
    } catch (error) {
        console.error('Error updating config file:', error);
        throw error;
    }
}

export const updateConfigValue = <K extends keyof UserConfig>(
    key: K,
    value: UserConfig[K]
): void => {
    updateConfig({ [key]: value });
}

export const getConfigValue = <K extends keyof UserConfig>(key: K): UserConfig[K] => {
    const config = readConfig();
    return config[key];
}