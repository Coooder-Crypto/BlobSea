const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

export function hexToBytes(hex: string): Uint8Array {
  if (!hex) return new Uint8Array();
  const normalized = hex.startsWith("0x") ? hex.slice(2) : hex;
  if (normalized.length % 2 !== 0) {
    throw new Error("Hex string length must be even");
  }
  const bytes = new Uint8Array(normalized.length / 2);
  for (let i = 0; i < normalized.length; i += 2) {
    bytes[i / 2] = parseInt(normalized.slice(i, i + 2), 16);
  }
  return bytes;
}

export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function concatBytes(...arrays: Uint8Array[]): Uint8Array {
  const total = arrays.reduce((sum, arr) => sum + arr.length, 0);
  const result = new Uint8Array(total);
  let offset = 0;
  arrays.forEach((arr) => {
    result.set(arr, offset);
    offset += arr.length;
  });
  return result;
}

export function utf8FromBytes(bytes: Uint8Array): string {
  return textDecoder.decode(bytes);
}

export function stringToBytes(value: string): Uint8Array {
  return textEncoder.encode(value);
}

export function bytesFromSui(value: any): Uint8Array {
  if (!value) return new Uint8Array();
  if (typeof value === "string") {
    if (value.startsWith("0x")) {
      return hexToBytes(value);
    }
    return stringToBytes(value);
  }
  if (Array.isArray(value)) {
    return Uint8Array.from(value);
  }
  return new Uint8Array();
}
