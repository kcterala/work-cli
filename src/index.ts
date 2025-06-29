#!/usr/bin/env bun

import { Command } from "commander";
import { initialize } from "../services/initService";
import { addTaskToTodoistProject, viewTasksInTodoistProject } from "../services/todoistService";
import type { UserConfig } from "../services/configService";

const userConfig: UserConfig = await initialize();

const program = new Command();
program
    .command('add')
    .action(() => {
        addTaskToTodoistProject();
    })

program
    .command('view')
    .action(() => {
        viewTasksInTodoistProject();
    })

program.parse()




