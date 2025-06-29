import path from "path";
import { homedir } from "os";

export const CONFIG_DIR = path.join(homedir(), ".config", "standup-cli");
export const CONFIG_PATH = path.join(CONFIG_DIR, "config.json");
