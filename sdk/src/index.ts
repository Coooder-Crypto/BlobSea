#!/usr/bin/env node
import { Command } from "commander";
import { createLogger } from "./lib/logger.js";
import { registerUploadCommand } from "./commands/upload.js";
import { registerEncryptCommand } from "./commands/encrypt.js";
import { registerConfigCommand } from "./commands/config.js";
import { registerListingCommand } from "./commands/listing.js";
import { registerLicenseCommand } from "./commands/license.js";
import pkg from "../package.json" assert { type: "json" };

const program = new Command();
const logger = createLogger();

program.name("blobsea-cli").description("BlobSea Walrus/Sui command-line toolkit").version(pkg.version);

registerConfigCommand(program);
registerEncryptCommand(program);
registerUploadCommand(program);
registerListingCommand(program);
registerLicenseCommand(program);

program.parseAsync(process.argv).catch((error) => {
  logger.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
