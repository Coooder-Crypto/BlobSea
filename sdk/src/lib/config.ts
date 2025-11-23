import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import dotenv from "dotenv";

dotenv.config();

export type BlobSeaConfig = {
  walrusGateway?: string;
  walrusBlobBase?: string;
  marketplacePackageId?: string;
  marketplaceId?: string;
  suiRpcUrl?: string;
  suiPrivateKey?: string;
};

export function loadConfig(explicitPath?: string): BlobSeaConfig {
  const path = explicitPath ? resolve(process.cwd(), explicitPath) : resolve(process.cwd(), "blobsea.config.json");
  let fileConfig: BlobSeaConfig = {};

  if (existsSync(path)) {
    try {
      fileConfig = JSON.parse(readFileSync(path, "utf-8"));
    } catch (error) {
      throw new Error(`Failed to parse config at ${path}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  return {
    walrusGateway: process.env.BLOBSEA_WALRUS_GATEWAY ?? fileConfig.walrusGateway,
    walrusBlobBase: process.env.BLOBSEA_WALRUS_BLOB_BASE ?? fileConfig.walrusBlobBase,
    marketplacePackageId: process.env.BLOBSEA_MARKETPLACE_PACKAGE_ID ?? fileConfig.marketplacePackageId,
    marketplaceId: process.env.BLOBSEA_MARKETPLACE_ID ?? fileConfig.marketplaceId,
    suiRpcUrl: process.env.BLOBSEA_SUI_RPC_URL ?? fileConfig.suiRpcUrl,
    suiPrivateKey: process.env.BLOBSEA_SUI_PRIVATE_KEY ?? fileConfig.suiPrivateKey,
  };
}

export function assertConfig(config: BlobSeaConfig) {
  const missing: string[] = [];
  if (!config.walrusGateway) missing.push("walrusGateway");
  if (!config.marketplacePackageId) missing.push("marketplacePackageId");
  if (!config.marketplaceId) missing.push("marketplaceId");

  if (missing.length) {
    throw new Error(`Missing required config keys: ${missing.join(", ")}`);
  }
}
