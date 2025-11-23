import { randomBytes, createCipheriv, createDecipheriv } from "node:crypto";
import { readFile } from "node:fs/promises";
import { basename, resolve } from "node:path";
import { fetch } from "undici";

import { bytesToHex, sha3Hex, hexToBytes } from "./bytes.js";
import { Manifest } from "./manifest.js";

export type EncryptOptions = {
  filePath: string;
  termsPath?: string;
};

export async function encryptFile(options: EncryptOptions): Promise<{ manifest: Manifest; payload: Buffer }>
{
  const resolvedFile = resolve(process.cwd(), options.filePath);
  const fileBuffer = await readFile(resolvedFile);
  const key = randomBytes(32);
  const nonce = randomBytes(12);

  const cipher = createCipheriv("aes-256-gcm", key, nonce);
  const encrypted = Buffer.concat([cipher.update(fileBuffer), cipher.final()]);
  const authTag = cipher.getAuthTag();
  const payload = Buffer.concat([nonce, authTag, encrypted]);

  let termsHash = sha3Hex(Buffer.from("blobsea-default-terms"));
  if (options.termsPath) {
    const termsBuffer = await readFile(resolve(process.cwd(), options.termsPath));
    termsHash = sha3Hex(termsBuffer);
  }

  const manifest: Manifest = {
    blobId: null,
    walrusHash: null,
    contentHash: sha3Hex(payload),
    keyHex: `0x${bytesToHex(key)}`,
    nonceHex: `0x${bytesToHex(nonce)}`,
    termsHash,
    payloadBytes: payload.length,
    sourceFileName: basename(resolvedFile),
    sourceFileSize: fileBuffer.length,
    uploadedAt: new Date().toISOString(),
  };

  return { manifest, payload };
}

export function buildKeyPackage(key: Uint8Array, nonce: Uint8Array, fileName?: string) {
  const nameBytes = new TextEncoder().encode(fileName ?? "blobsea-file");
  const nameLength = new Uint8Array(2);
  new DataView(nameLength.buffer).setUint16(0, nameBytes.length, true);
  return Buffer.concat([Buffer.from(nonce), Buffer.from(key), Buffer.from(nameLength), Buffer.from(nameBytes)]);
}

export function splitKeyPackage(pkg: Uint8Array) {
  if (pkg.length < 46) throw new Error("Key package is too short");
  const nonce = pkg.slice(0, 12);
  const key = pkg.slice(12, 44);
  const nameLength = new DataView(pkg.slice(44, 46).buffer).getUint16(0, true);
  const nameBytes = pkg.slice(46, 46 + nameLength);
  return { nonce, key, fileName: new TextDecoder().decode(nameBytes) };
}

export async function uploadToWalrus(endpoint: string, payload: Buffer) {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "content-type": "application/octet-stream" },
    body: payload,
  });
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`Walrus upload failed: ${response.status} ${response.statusText} -> ${text}`);
  }
  try {
    return JSON.parse(text);
  } catch (error) {
    throw new Error("Walrus response was not valid JSON");
  }
}

export async function downloadWalrusBlob(baseUrl: string, blobId: string) {
  const normalized = baseUrl.replace(/\/$/, "");
  const target = `${normalized}/v1/blobs/${encodeURIComponent(blobId)}`;
  const response = await fetch(target);
  if (!response.ok) {
    throw new Error(`Walrus download failed: ${response.statusText}`);
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.length < 28) {
    throw new Error("Walrus payload too short");
  }
  return buffer;
}

export async function decryptWalrusPayload(payload: Buffer, licenseKeyHex: string, walrusHash?: string | null, expectedBlobId?: string) {
  if (walrusHash) {
    const computed = sha3Hex(payload);
    const normalizedStored = walrusHash.startsWith("0x") ? walrusHash.slice(2) : walrusHash;
    if (computed !== normalizedStored) {
      console.warn(`[walrus] hash mismatch blob=${expectedBlobId ?? "unknown"}`);
    }
  }
  const authTag = payload.slice(12, 28);
  const ciphertext = payload.slice(28);
  const keyPackage = hexToBytes(licenseKeyHex);
  const { nonce, key, fileName } = splitKeyPackage(keyPackage);
  const decipher = createDecipheriv("aes-256-gcm", key, nonce);
  decipher.setAuthTag(authTag);
  const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return { buffer: decrypted, fileName };
}
