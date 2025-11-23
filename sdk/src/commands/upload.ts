import { Command } from "commander";
import { existsSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import { basename, resolve } from "node:path";
import { fetch } from "undici";

import { assertConfig, loadConfig } from "../lib/config.js";
import { createLogger } from "../lib/logger.js";
import { encryptFile } from "../lib/walrus.js";

type UploadOptions = {
  config?: string;
  terms?: string;
  manifest?: string;
  payload?: string;
  endpoint?: string;
  dryRun?: boolean;
};

export function registerUploadCommand(program: Command) {
  program
    .command("upload <file>")
    .description("Encrypt a file and upload it to a Walrus gateway")
    .option("-c, --config <path>", "Path to blobsea.config.json")
    .option("-t, --terms <path>", "License terms file to hash into the manifest")
    .option("-m, --manifest <path>", "Where to write manifest JSON", "manifest.json")
    .option("-p, --payload <path>", "Where to write encrypted payload", "payload.blob")
    .option("-e, --endpoint <url>", "Override Walrus upload endpoint")
    .option("--dry-run", "Skip the actual HTTP upload")
    .action(async (file: string, options: UploadOptions) => {
      const logger = createLogger("upload");
      const resolvedFile = resolve(process.cwd(), file);
      if (!existsSync(resolvedFile)) {
        logger.error(`File not found: ${resolvedFile}`);
        process.exitCode = 1;
        return;
      }

      const config = loadConfig(options.config);
      try {
        assertConfig(config);
      } catch (error) {
        logger.error(error instanceof Error ? error.message : String(error));
        process.exitCode = 1;
        return;
      }

      logger.info(`Encrypting ${basename(resolvedFile)} ...`);
      try {
        const { manifest, payload } = await encryptFile({ filePath: resolvedFile, termsPath: options.terms });

        const manifestPath = resolve(process.cwd(), options.manifest ?? "manifest.json");
        const payloadPath = resolve(process.cwd(), options.payload ?? "payload.blob");
        await writeFile(manifestPath, JSON.stringify(manifest, null, 2), "utf-8");
        await writeFile(payloadPath, payload);
        logger.success(`Manifest written to ${manifestPath}`);
        logger.success(`Payload written to ${payloadPath}`);

        if (options.dryRun) {
          logger.warn("Skipping upload because --dry-run was provided.");
          return;
        }

        const endpoint = (options.endpoint ?? config.walrusGateway ?? "").replace(/\/$/, "").concat("/v1/blobs");
        logger.info(`Uploading payload to ${endpoint}`);
        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "content-type": "application/octet-stream" },
          body: payload,
        });

        const responseText = await response.text();
        if (!response.ok) {
          throw new Error(`Walrus upload failed: ${response.status} ${response.statusText} -> ${responseText}`);
        }
        let responseJson: Record<string, any> = {};
        try {
          responseJson = JSON.parse(responseText);
        } catch (error) {
          logger.warn("Walrus response was not JSON; continuing with original manifest.");
        }

        const enhancedManifest = {
          ...manifest,
          blobId: responseJson.blobId ?? responseJson.id ?? manifest.blobId,
          walrusHash: responseJson.hash ?? manifest.walrusHash,
          suiBlobObjectId: responseJson.raw?.newlyCreated?.blobObject?.id ?? manifest.suiBlobObjectId,
        };

        await writeFile(manifestPath, JSON.stringify(enhancedManifest, null, 2), "utf-8");
        logger.success("Upload complete. Manifest updated with Walrus identifiers.");
      } catch (error) {
        logger.error(error instanceof Error ? error.message : String(error));
        process.exitCode = 1;
      }
    });
}
