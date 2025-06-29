#!/usr/bin/env bun

import { Command } from "commander";
import { initialize } from "../init";
import { addTaskToTodoistProject, viewTasksInTodoistProject } from "../resources/service";
import type { UserConfig } from "../config-manager";

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




