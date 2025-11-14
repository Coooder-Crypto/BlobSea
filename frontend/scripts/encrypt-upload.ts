import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createCipheriv, createHash, randomBytes } from "node:crypto";

type UploadResponse = {
  blobId: string | null;
  hash: string | null;
  proof?: unknown;
  raw?: unknown;
};

async function main() {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error("Usage: pnpm encrypt:upload <path-to-file>");
    process.exit(1);
  }

  const absolutePath = resolve(filePath);
  const fileBuffer = await readFile(absolutePath);

  const dataKey = randomBytes(32);
  const nonce = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", dataKey, nonce);
  const encrypted = Buffer.concat([cipher.update(fileBuffer), cipher.final()]);
  const authTag = cipher.getAuthTag();
  const payload = Buffer.concat([nonce, authTag, encrypted]);

  const contentHash = createHash("sha3-256").update(payload).digest("hex");
  const termsBlob = process.env.BLOBSEA_TERMS_PATH
    ? await readFile(resolve(process.env.BLOBSEA_TERMS_PATH))
    : Buffer.from("blobsea-default-terms");
  const termsHash = createHash("sha3-256").update(termsBlob).digest("hex");

  const endpoint =
    process.env.BLOBSEA_WALRUS_UPLOAD_ENDPOINT ??
    "http://localhost:3000/api/walrus/upload";

  const uploadResponse = await fetch(endpoint, {
    method: "POST",
    headers: {
      "content-type": "application/octet-stream",
    },
    body: payload,
  });

  if (!uploadResponse.ok) {
    const text = await uploadResponse.text();
    throw new Error(`Walrus upload failed: ${uploadResponse.status} ${text}`);
  }

  const uploaded: UploadResponse = await uploadResponse.json();
  const manifest = {
    sourceFile: absolutePath,
    blobId: uploaded.blobId,
    walrusHash: uploaded.hash ?? null,
    contentHash,
    keyHex: `0x${dataKey.toString("hex")}`,
    nonceHex: `0x${nonce.toString("hex")}`,
    termsHash,
    payloadBytes: payload.length,
    uploadedAt: new Date().toISOString(),
  };

  const manifestPath = `${absolutePath}.manifest.json`;
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2));

  console.log("Upload complete");
  console.table({
    blobId: manifest.blobId,
    contentHash,
    termsHash,
    manifestPath,
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
