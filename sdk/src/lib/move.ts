import { bcs } from "@mysten/sui/bcs";

export function pureVectorBytes(bytes: Uint8Array) {
  return bcs.vector(bcs.u8()).serialize(Array.from(bytes)).toBytes();
}
