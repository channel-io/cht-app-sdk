#!/usr/bin/env node
import { Command } from "commander";
import { createCommand } from "./commands/create.js";
import { addCommand } from "./commands/add.js";
import { devCommand } from "./commands/dev.js";
import { buildCommand } from "./commands/build.js";
import { generateCommand } from "./commands/generate.js";

const program = new Command();

program.name("channel-app").description("CLI for Channel.io App SDK").version("0.0.1");

// Register commands
program.addCommand(createCommand);
program.addCommand(addCommand);
program.addCommand(devCommand);
program.addCommand(buildCommand);
program.addCommand(generateCommand);

program.parse();
