import { Command } from "commander";
import { createLogger } from "../lib/logger.js";
import { loadConfig } from "../lib/config.js";

export function registerConfigCommand(program: Command) {
  program
    .command("config")
    .description("Inspect CLI configuration")
    .option("-c, --config <path>", "Path to blobsea.config.json", "blobsea.config.json")
    .action((options: { config: string }) => {
      const logger = createLogger("config");
      try {
        const config = loadConfig(options.config);
        logger.info("Resolved configuration:");
        console.log(JSON.stringify(config, null, 2));
      } catch (error) {
        logger.error(error instanceof Error ? error.message : String(error));
        process.exitCode = 1;
      }
    });
}
