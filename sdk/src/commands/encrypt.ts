import { Command } from "commander";
import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import { createLogger } from "../lib/logger.js";
import { encryptFile } from "../lib/walrus.js";

export function registerEncryptCommand(program: Command) {
  program
    .command("encrypt <file>")
    .description("Encrypt a file locally and emit a BlobSea manifest")
    .option("-t, --terms <path>", "Path to custom license terms file")
    .option("-m, --manifest <path>", "Where to write manifest JSON", "manifest.json")
    .option("-p, --payload <path>", "Where to write encrypted payload", "payload.blob")
    .action(async (file: string, options: { terms?: string; manifest: string; payload: string }) => {
      const logger = createLogger("encrypt");
      try {
        const { manifest, payload } = await encryptFile({ filePath: file, termsPath: options.terms });
        const manifestPath = resolve(process.cwd(), options.manifest);
        const payloadPath = resolve(process.cwd(), options.payload);

        await writeFile(manifestPath, JSON.stringify(manifest, null, 2), "utf-8");
        await writeFile(payloadPath, payload);

        logger.success(`Manifest written to ${manifestPath}`);
        logger.success(`Encrypted payload written to ${payloadPath}`);
        logger.info("Upload to Walrus and on-chain listing creation are coming soon.");
      } catch (error) {
        logger.error(error instanceof Error ? error.message : String(error));
        process.exitCode = 1;
      }
    });
}
