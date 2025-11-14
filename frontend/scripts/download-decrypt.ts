import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createDecipheriv, createHash } from "node:crypto";

type Manifest = {
  blobId: string;
  contentHash: string;
  keyHex: string;
  nonceHex: string;
};

async function main() {
  const manifestPath = process.argv[2];
  const outputPathArg = process.argv[3];

  if (!manifestPath) {
    console.error("Usage: pnpm download:decrypt <manifest.json> [output]");
    process.exit(1);
  }

  const manifest: Manifest = JSON.parse(
    await readFile(resolve(manifestPath), "utf-8"),
  );
  if (!manifest.blobId) {
    throw new Error("Manifest missing blobId");
  }

  const proxyBase =
    process.env.BLOBSEA_WALRUS_PROXY_BASE ??
    "http://localhost:3000/api/walrus";
  const target = `${proxyBase}/${manifest.blobId}`;
  const response = await fetch(target);

  if (!response.ok || !response.body) {
    const text = await response.text();
    throw new Error(`Failed to download blob: ${response.status} ${text}`);
  }

  const payload = Buffer.from(await response.arrayBuffer());
  const hash = createHash("sha3-256").update(payload).digest("hex");
  if (manifest.contentHash && hash !== manifest.contentHash) {
    throw new Error(
      `Hash mismatch. expected=${manifest.contentHash} actual=${hash}`,
    );
  }

  const nonce = Buffer.from(manifest.nonceHex.replace(/^0x/, ""), "hex");
  const key = Buffer.from(manifest.keyHex.replace(/^0x/, ""), "hex");
  const authTag = payload.subarray(12, 28);
  const ciphertext = payload.subarray(28);

  const decipher = createDecipheriv("aes-256-gcm", key, nonce);
  decipher.setAuthTag(authTag);
  const plaintext = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);

  const outputPath =
    outputPathArg ??
    resolve(
      process.cwd(),
      `${manifest.blobId.slice(0, 8)}-decrypted.bin`.replace(/\//g, "_"),
    );
  await writeFile(outputPath, plaintext);

  console.log(`Downloaded and decrypted to ${outputPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
