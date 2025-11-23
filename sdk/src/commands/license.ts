import { Command } from "commander";
import { resolve } from "node:path";
import { writeFile } from "node:fs/promises";

import { createLogger } from "../lib/logger.js";
import { loadConfig, BlobSeaConfig } from "../lib/config.js";
import { createSuiClient, getKeypair } from "../lib/sui.js";
import { downloadWalrusBlob, decryptWalrusPayload } from "../lib/walrus.js";
import { bytesToHex } from "../lib/bytes.js";

export function registerLicenseCommand(program: Command) {
  const licenseCommand = program.command("license").description("Interact with BlobSea licenses");

  licenseCommand
    .command("list")
    .description("List licenses owned by a wallet")
    .option("-c, --config <path>", "Path to blobsea.config.json")
    .option("-o, --owner <address>", "Wallet address; defaults to keypair derived from suiPrivateKey")
    .action(async (options: { config?: string; owner?: string }) => {
      const logger = createLogger("license:list");
      try {
        const config = loadConfig(options.config);
        const client = createSuiClient(config);
        const owner = options.owner ?? deriveAddress(config);
        const packageId = config.marketplacePackageId;
        if (!packageId) throw new Error("marketplacePackageId missing in configuration");
        const structType = `${packageId}::marketplace::License`;
        const response = await client.getOwnedObjects({
          owner,
          filter: { StructType: structType },
          options: { showContent: true },
        });
        if (!response.data.length) {
          logger.info(`No licenses found for ${owner}`);
          return;
        }
        response.data.forEach((item) => {
          const fields = (item.data?.content as any)?.fields;
          logger.info(`License ${item.data?.objectId} listing=${fields?.listing_id} granted_at=${fields?.granted_at}`);
        });
      } catch (error) {
        logger.error(error instanceof Error ? error.message : String(error));
        process.exitCode = 1;
      }
    });

  licenseCommand
    .command("download <licenseId>")
    .description("Download and decrypt a dataset using a license")
    .option("-c, --config <path>", "Path to blobsea.config.json")
    .option("-o, --out <path>", "Where to write the decrypted file")
    .action(async (licenseId: string, options: { config?: string; out?: string }) => {
      const logger = createLogger("license:download");
      try {
        const config = loadConfig(options.config);
        if (!config.walrusGateway && !config.walrusBlobBase) {
          throw new Error("walrusGateway or walrusBlobBase required for downloads");
        }
        const client = createSuiClient(config);
        const licenseObject = await client.getObject({ id: licenseId, options: { showContent: true } });
        const licenseFields = (licenseObject.data?.content as any)?.fields;
        if (!licenseFields) throw new Error("Unable to read license fields");
        const listingId = licenseFields.listing_id as string;
        const encryptedKey = Uint8Array.from(licenseFields.encrypted_key as number[]);

        const listingObject = await client.getObject({ id: listingId, options: { showContent: true } });
        const listingFields = (listingObject.data?.content as any)?.fields;
        if (!listingFields) throw new Error("Unable to read listing fields");
        const blobIdBytes = Uint8Array.from(listingFields.walrus_blob_id as number[]);
        const blobId = new TextDecoder().decode(blobIdBytes).trim();
        if (!blobId) throw new Error("Listing missing Walrus blob ID");
        const walrusHashBytes = Uint8Array.from(listingFields.walrus_hash as number[]);
        const walrusHash = walrusHashBytes.length ? bytesToHex(walrusHashBytes) : null;

        const base = (config.walrusBlobBase ?? config.walrusGateway) ?? "";
        logger.info(`Downloading blob ${blobId} from ${base}`);
        const payload = await downloadWalrusBlob(base, blobId);
        const licenseHex = `0x${Buffer.from(encryptedKey).toString("hex")}`;
        const { buffer, fileName } = await decryptWalrusPayload(payload, licenseHex, walrusHash, blobId);
        const outPath = resolve(process.cwd(), options.out ?? fileName ?? `${licenseId}.bin`);
        await writeFile(outPath, buffer);
        logger.success(`Decrypted file written to ${outPath}`);
      } catch (error) {
        logger.error(error instanceof Error ? error.message : String(error));
        process.exitCode = 1;
      }
    });
}

function deriveAddress(config: BlobSeaConfig) {
  const keypair = getKeypair(config.suiPrivateKey);
  return keypair.getPublicKey().toSuiAddress();
}
