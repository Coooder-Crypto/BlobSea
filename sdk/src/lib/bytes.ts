import { sha3_256 } from "@noble/hashes/sha3";

export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function hexToBytes(hex: string): Uint8Array {
  const normalized = hex.startsWith("0x") ? hex.slice(2) : hex;
  if (normalized.length % 2 !== 0) throw new Error("Hex string length must be even");
  const bytes = new Uint8Array(normalized.length / 2);
  for (let i = 0; i < normalized.length; i += 2) {
    bytes[i / 2] = parseInt(normalized.slice(i, i + 2), 16);
  }
  return bytes;
}

export function sha3Hex(data: Uint8Array): string {
  return bytesToHex(sha3_256(data));
}

export function stringToBytes(value: string) {
  return new TextEncoder().encode(value ?? "");
}
