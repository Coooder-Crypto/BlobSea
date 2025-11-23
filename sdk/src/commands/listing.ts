import { Command } from "commander";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { Transaction } from "@mysten/sui/transactions";

import { createLogger } from "../lib/logger.js";
import { loadConfig, BlobSeaConfig } from "../lib/config.js";
import { createSuiClient, getKeypair } from "../lib/sui.js";
import { hexToBytes, stringToBytes } from "../lib/bytes.js";
import { pureVectorBytes } from "../lib/move.js";
import { buildKeyPackage } from "../lib/walrus.js";
import type { Manifest } from "../lib/manifest.js";

const SUI_TYPE = "0x2::sui::SUI";

export function registerListingCommand(program: Command) {
  const listingCommand = program.command("listing").description("Interact with BlobSea listings");

  listingCommand
    .command("create <manifest>")
    .description("Create a listing on-chain using a manifest")
    .requiredOption("-p, --price <sui>", "Listing price in SUI")
    .option("-n, --name <name>", "Listing name override")
    .option("-d, --description <text>", "Listing description override")
    .option("-c, --config <path>", "Path to blobsea.config.json")
    .action(async (manifestPath: string, options: { price: string; name?: string; description?: string; config?: string }) => {
      const logger = createLogger("listing:create");
      try {
        const config = loadConfig(options.config);
        ensureListingConfig(config);
        const manifest = await readManifest(manifestPath);
        const tx = buildCreateListingTx({ manifest, config, price: options.price, name: options.name, description: options.description });

        const client = createSuiClient(config);
        const signer = getKeypair(config.suiPrivateKey);
        logger.info("Signing and executing transaction...");
        const result = await client.signAndExecuteTransaction({ signer, transaction: tx, options: { showEffects: true } });
        logger.success(`Digest: ${result.digest}`);
        logger.info("Waiting for confirmation...");
        await client.waitForTransaction({ digest: result.digest });
        logger.success("Listing created on-chain.");
      } catch (error) {
        logger.error(error instanceof Error ? error.message : String(error));
        process.exitCode = 1;
      }
    });

  listingCommand
    .command("list")
    .description("Display latest listing events")
    .option("-c, --config <path>", "Path to blobsea.config.json")
    .option("-l, --limit <n>", "Number of events", "10")
    .action(async (options: { config?: string; limit: string }) => {
      const logger = createLogger("listing:list");
      try {
        const config = loadConfig(options.config);
        if (!config.marketplacePackageId) {
          throw new Error("marketplacePackageId missing in configuration");
        }
        const client = createSuiClient(config);
        const eventType = `${config.marketplacePackageId}::marketplace::ListingCreated`;
        const limit = Math.min(50, Math.max(1, Number(options.limit) || 10));
        const events = await client.queryEvents({ query: { MoveEventType: eventType }, order: "descending", limit });
        if (!events.data.length) {
          logger.info("No listings found.");
          return;
        }
        events.data.forEach((event) => {
          const parsed = event.parsedJson as any;
          logger.info(
            `Listing ${parsed?.listing_id ?? "unknown"} | seller=${parsed?.seller} | price=${Number(parsed?.price ?? 0) / 1_000_000_000} SUI`,
          );
        });
      } catch (error) {
        logger.error(error instanceof Error ? error.message : String(error));
        process.exitCode = 1;
      }
    });
}

function ensureListingConfig(config: BlobSeaConfig) {
  if (!config.marketplacePackageId || !config.marketplaceId) {
    throw new Error("marketplacePackageId/marketplaceId missing in configuration");
  }
  if (!config.suiRpcUrl) {
    throw new Error("suiRpcUrl missing in configuration");
  }
  if (!config.suiPrivateKey) {
    throw new Error("suiPrivateKey missing in configuration");
  }
}

async function readManifest(path: string): Promise<Manifest> {
  const resolved = resolve(process.cwd(), path);
  const json = JSON.parse(await readFile(resolved, "utf-8"));
  return json as Manifest;
}

function buildCreateListingTx({
  manifest,
  config,
  price,
  name,
  description,
}: {
  manifest: Manifest;
  config: BlobSeaConfig;
  price: string;
  name?: string;
  description?: string;
}) {
  if (!manifest.blobId) throw new Error("Manifest missing blobId; upload to Walrus first");
  const tx = new Transaction();
  const trimmedName = (name ?? manifest.sourceFileName ?? "BlobSea Listing").trim();
  const descriptionText = (description ?? "").trim();
  const nameBytes = stringToBytes(trimmedName);
  const descriptionBytes = stringToBytes(descriptionText);
  const walrusBlobIdBytes = stringToBytes(manifest.blobId);
  const walrusHashBytes = manifest.walrusHash ? hexToBytes(manifest.walrusHash) : hexToBytes(manifest.contentHash);
  const termsBytes = hexToBytes(manifest.termsHash);
  const keyBytes = buildKeyPackage(hexToBytes(manifest.keyHex), hexToBytes(manifest.nonceHex), manifest.sourceFileName);

  tx.moveCall({
    target: `${config.marketplacePackageId}::marketplace::create_listing`,
    typeArguments: [SUI_TYPE],
    arguments: [
      tx.object(config.marketplaceId!),
      tx.pure.u64(toMist(price)),
      tx.pure(pureVectorBytes(nameBytes)),
      tx.pure(pureVectorBytes(descriptionBytes)),
      tx.pure(pureVectorBytes(walrusBlobIdBytes)),
      tx.pure(pureVectorBytes(walrusHashBytes)),
      tx.pure(pureVectorBytes(termsBytes)),
      tx.pure(pureVectorBytes(keyBytes)),
      tx.pure.u8(0),
    ],
  });

  return tx;
}

function toMist(value: string): bigint {
  const numeric = Number(value);
  if (!isFinite(numeric) || numeric <= 0) {
    throw new Error("Price must be greater than 0");
  }
  return BigInt(Math.floor(numeric * 1_000_000_000));
}
