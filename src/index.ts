#!/usr/bin/env bun

import { Command } from "commander";
import { initialize } from "../services/initService";
import { addTaskToTodoistProject, createStandupSummary, viewTasksInTodoistProject } from "../services/todoistService";
import type { UserConfig } from "../services/configService";
import { getIpAddress } from "../services/utilityService";

const userConfig: UserConfig = await initialize();

const program = new Command();
program
    .command('add')
    .action(async () => {
        await addTaskToTodoistProject();
    })

program
    .command('view')
    .action(async () => {
        await viewTasksInTodoistProject();
    })

program
    .command("standup")
    .action(async () => {
        await createStandupSummary();
    })

program
    .command("ip")
    .action(async () => {
        await getIpAddress();
    })

program
    .command("update")
    .description("Update the CLI to the latest version")
    .action(async () => {
        const { $ } = await import("bun");
        const scriptUrl = "https://raw.githubusercontent.com/kcterala/work-cli/main/install.sh";

        console.log("Updating to the latest version...");
        await $`curl -fsSL ${scriptUrl} | bash`;
    });


program.parse()




