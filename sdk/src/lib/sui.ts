import { SuiClient } from "@mysten/sui/client";
import { decodeSuiPrivateKey } from "@mysten/sui/cryptography";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import type { BlobSeaConfig } from "./config.js";

export function createSuiClient(config: BlobSeaConfig) {
  const url = config.suiRpcUrl ?? "https://fullnode.testnet.sui.io";
  return new SuiClient({ url });
}

export function getKeypair(privateKey?: string) {
  if (!privateKey) throw new Error("suiPrivateKey missing in configuration");
  const { schema, secretKey } = decodeSuiPrivateKey(privateKey);
  if (schema !== "ED25519") {
    throw new Error(`Unsupported key scheme ${schema}`);
  }
  return Ed25519Keypair.fromSecretKey(secretKey);
}
