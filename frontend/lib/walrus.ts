import { sha3_256 } from "@noble/hashes/sha3";
import { bytesToHex, concatBytes, stringToBytes } from "@/lib/bytes";

export type WalrusUploadResult = {
  blobId: string | null;
  hash: string | null;
  proof?: unknown;
  raw?: unknown;
};

export type Manifest = {
  blobId: string | null;
  walrusHash: string | null;
  contentHash: string;
  keyHex: string;
  nonceHex: string;
  termsHash: string;
  payloadBytes: number;
  sourceFileName: string;
  sourceFileSize: number;
  uploadedAt: string;
  suiBlobObjectId?: string | null;
};

type EncryptOptions = {
  termsFile?: File | null;
  endpoint?: string;
  query?: Record<string, string | number | boolean>;
};

const DEFAULT_ENDPOINT = "/api/walrus/upload";

export async function encryptAndUpload(
  file: File,
  options: EncryptOptions = {},
): Promise<{ manifest: Manifest; response: WalrusUploadResult }> {
  const endpoint = options.endpoint ?? DEFAULT_ENDPOINT;
  const query = options.query ?? {};
  const search = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    search.set(key, String(value));
  });
  const target =
    search.toString().length > 0 ? `${endpoint}?${search.toString()}` : endpoint;
  const payload = await buildEncryptedPayload(file);
  const termsHash = await getTermsHash(options.termsFile);

  const contentHash = bytesToHex(sha3_256(payload.payload));
  const body = payload.payload;

  const uploadResponse = await fetch(target, {
    method: "POST",
    headers: {
      "content-type": "application/octet-stream",
    },
    body,
  });

  const responseJson = (await uploadResponse.json().catch(() => null)) ?? {};
  if (!uploadResponse.ok) {
    throw new Error(
      responseJson?.error ??
        `Walrus upload failed: ${uploadResponse.statusText}`,
    );
  }

  const manifest: Manifest = {
    blobId: responseJson.blobId ?? null,
    walrusHash: responseJson.hash ?? null,
    contentHash,
    keyHex: `0x${bytesToHex(payload.key)}`,
    nonceHex: `0x${bytesToHex(payload.nonce)}`,
    termsHash,
    payloadBytes: body.length,
    sourceFileName: file.name,
    sourceFileSize: file.size,
    uploadedAt: new Date().toISOString(),
    suiBlobObjectId: responseJson.raw?.newlyCreated?.blobObject?.id ?? null,
  };

  return { manifest, response: responseJson };
}

async function buildEncryptedPayload(file: File) {
  const fileBuffer = new Uint8Array(await file.arrayBuffer());
  const key = crypto.getRandomValues(new Uint8Array(32));
  const nonce = crypto.getRandomValues(new Uint8Array(12));

  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    key,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt"],
  );

  const encrypted = new Uint8Array(
    await crypto.subtle.encrypt(
      { name: "AES-GCM", iv: nonce },
      cryptoKey,
      fileBuffer,
    ),
  );

  const authTag = encrypted.slice(encrypted.length - 16);
  const ciphertext = encrypted.slice(0, encrypted.length - 16);
  const payload = new Uint8Array(nonce.length + authTag.length + ciphertext.length);
  payload.set(nonce, 0);
  payload.set(authTag, nonce.length);
  payload.set(ciphertext, nonce.length + authTag.length);

  return { payload, key, nonce };
}

async function getTermsHash(termsFile?: File | null) {
  if (!termsFile) {
    return bytesToHex(sha3_256(new TextEncoder().encode("blobsea-default-terms")));
  }
  const bytes = new Uint8Array(await termsFile.arrayBuffer());
  return bytesToHex(sha3_256(bytes));
}

export function manifestToBlob(manifest: Manifest) {
  const json = JSON.stringify(manifest, null, 2);
  return new Blob([json], { type: "application/json" });
}
export function buildKeyPackage(key: Uint8Array, nonce: Uint8Array, fileName?: string) {
  const nameBytes = stringToBytes(fileName || "blobsea-file");
  const nameLength = new Uint8Array(2);
  new DataView(nameLength.buffer).setUint16(0, nameBytes.length, true);
  return concatBytes(nonce, key, nameLength, nameBytes);
}
