"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSuiClient } from "@mysten/dapp-kit";
import { sha3_256 } from "@noble/hashes/sha3";
import { Download, Key, RefreshCcw } from "lucide-react";

import { useNetworkVariable } from "@/lib/networkConfig";
import { Button as PixelButton } from "@/components/UI/Button";
import { bytesFromSui, bytesToHex, concatBytes, utf8FromBytes } from "@/lib/bytes";

type Props = {
  currentAddress?: string;
};

type LicenseRecord = {
  objectId: string;
  listingId: string;
  encryptedKey: Uint8Array;
  grantedAt: number;
  listingName?: string;
  listingDescription?: string;
};

type DownloadState =
  | { state: "idle" }
  | { state: "pending" }
  | { state: "success" }
  | { state: "error"; message: string };

export default function LicenseInventory({ currentAddress }: Props) {
  const marketplacePackageId = useNetworkVariable("marketplacePackageId");
  const suiClient = useSuiClient();
  const [downloadStatus, setDownloadStatus] = useState<Record<string, DownloadState>>({});

  const {
    data: licenses,
    isLoading,
    error,
    refetch,
  } = useQuery<LicenseRecord[]>({
    queryKey: ["blobsea-licenses", currentAddress, marketplacePackageId],
    enabled: Boolean(currentAddress && marketplacePackageId),
    queryFn: async () => {
      if (!currentAddress || !marketplacePackageId) return [];
      const structType = `${marketplacePackageId}::marketplace::License`;
      const response = await suiClient.getOwnedObjects({
        owner: currentAddress,
        filter: { StructType: structType },
        options: { showContent: true },
      });
      const base = response.data.map((item) => {
        const fields = (item.data?.content as any)?.fields ?? {};
        return {
          objectId: item.data?.objectId ?? "",
          listingId: fields.listing_id ?? "",
          encryptedKey: bytesFromSui(fields.encrypted_key),
          grantedAt: Number(fields.granted_at ?? 0),
        } satisfies LicenseRecord;
      });
      return Promise.all(
        base.map(async (license) => {
          if (!license.listingId) return license;
          try {
            const listingObject = await suiClient.getObject({
              id: license.listingId,
              options: { showContent: true },
            });
            const listingFields = (listingObject.data?.content as any)?.fields;
            if (listingFields) {
              const nameBytes = bytesFromSui(listingFields.name);
              const descBytes = bytesFromSui(listingFields.description);
              return {
                ...license,
                listingName: nameBytes.length ? utf8FromBytes(nameBytes) : undefined,
                listingDescription: descBytes.length
                  ? utf8FromBytes(descBytes)
                  : undefined,
              };
            }
          } catch (lookupError) {
            console.warn("Failed to load listing metadata", lookupError);
          }
          return license;
        }),
      );
    },
    refetchInterval: 30_000,
  });

  const statusMessage = useMemo(() => {
    if (!currentAddress) return "Connect your wallet to view purchased licenses.";
    if (!marketplacePackageId)
      return "Configure marketplace package variables to sync your inventory.";
    if (isLoading) return "Loading your licenses...";
    if (error)
      return `Failed to load licenses: ${error instanceof Error ? error.message : String(error)}`;
    if (licenses && licenses.length === 0)
      return "No licenses yet. Purchase a listing to see it here.";
    return null;
  }, [currentAddress, marketplacePackageId, isLoading, error, licenses]);

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-pixel text-5xl text-white">MY LICENSE INVENTORY</h2>
          <p className="font-mono text-sm text-white/60">Manage purchased data access keys.</p>
        </div>
        <PixelButton variant="outline" size="sm" className="gap-1" onClick={() => refetch()}>
          <RefreshCcw className="h-4 w-4" /> Refresh
        </PixelButton>
      </div>

      {statusMessage ? (
        <div className="border-2 border-dashed border-white/15 p-8 text-center font-mono text-sm text-white/60">
          {statusMessage}
          {licenses && licenses.length === 0 && (
            <div className="mt-4 border border-white/15 p-6 text-xs text-white/50">
              More items will appear here after purchase.
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {licenses?.map((license) => (
            <LicenseCard
              key={license.objectId}
              license={license}
              suiClient={suiClient}
              status={downloadStatus[license.objectId] ?? { state: "idle" }}
              onStatusChange={(next) =>
                setDownloadStatus((prev) => ({ ...prev, [license.objectId]: next }))
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}

type LicenseCardProps = {
  license: LicenseRecord;
  suiClient: ReturnType<typeof useSuiClient>;
  status: DownloadState;
  onStatusChange: (state: DownloadState) => void;
};

function LicenseCard({ license, suiClient, status, onStatusChange }: LicenseCardProps) {
  const shortLicenseId = shorten(license.objectId, 6);
  const shortListingId = shorten(license.listingId);
  const listingTitle = license.listingName ?? shortListingId;
  const purchasedAt = license.grantedAt
    ? new Date(license.grantedAt).toLocaleString()
    : "Unknown";

  const handleDownload = async () => {
    onStatusChange({ state: "pending" });
    try {
      const listingObject = await suiClient.getObject({
        id: license.listingId,
        options: { showContent: true },
      });
      const listingFields = (listingObject.data?.content as any)?.fields;
      if (!listingFields) {
        throw new Error("Unable to read listing data");
      }
      const blobBytes = bytesFromSui(listingFields.walrus_blob_id);
      const blobId = utf8FromBytes(blobBytes).trim();
      if (!blobId) {
        throw new Error("Listing is missing a Walrus blob ID");
      }
      const walrusHashBytes = bytesFromSui(listingFields.walrus_hash);
      const walrusHashHex = walrusHashBytes.length ? bytesToHex(walrusHashBytes) : null;
      await downloadWithLicense({
        blobId,
        licenseKey: license.encryptedKey,
        walrusHashHex,
      });
      onStatusChange({ state: "success" });
    } catch (downloadError) {
      onStatusChange({
        state: "error",
        message:
          downloadError instanceof Error
            ? downloadError.message
            : "Download failed, please try again later",
      });
    }
  };

  return (
    <div className="flex flex-col gap-6 border-l-4 border-walrus-cyan border-y border-r border-white/15 bg-[#070d1a] p-6 transition hover:bg-white/5 md:flex-row md:items-center md:justify-between">
      <div className="flex items-start gap-4">
        <div className="border border-walrus-cyan/30 bg-walrus-cyan/10 p-3">
          <Key className="h-6 w-6 text-walrus-cyan" />
        </div>
        <div>
          <h3 className="font-mono text-lg font-bold text-white">{listingTitle}</h3>
          <p className="font-mono text-xs text-white/60">
            LICENSE ID: {shortLicenseId} • PURCHASED: {purchasedAt}
          </p>
          {license.listingDescription && (
            <p className="mt-1 text-xs text-white/50">{license.listingDescription}</p>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-3 text-right md:items-end">
        <div className="font-pixel text-xl text-walrus-cyan">VALID</div>
        <div className="font-mono text-xs text-white/50">Listing: {shortListingId}</div>
        <PixelButton
          size="sm"
          variant="secondary"
          className="justify-center gap-2"
          onClick={handleDownload}
          disabled={status.state === "pending"}
        >
          <Download className="h-4 w-4" />
          {status.state === "pending" ? "Decrypting" : "Decrypt & Download"}
        </PixelButton>
        {status.state === "error" && (
          <p className="font-mono text-xs text-red-400">{status.message}</p>
        )}
        {status.state === "success" && (
          <p className="font-mono text-xs text-walrus-green">Download complete</p>
        )}
      </div>
    </div>
  );
}

function shorten(value: string, visible = 4) {
  if (!value) return "—";
  if (value.length <= visible * 2) return value;
  return `${value.slice(0, visible)}...${value.slice(-visible)}`;
}

async function downloadWithLicense({
  blobId,
  licenseKey,
  walrusHashHex,
}: {
  blobId: string;
  licenseKey: Uint8Array;
  walrusHashHex: string | null;
}) {
  if (!licenseKey.length) {
    throw new Error("License is missing key data");
  }
  const { nonce, key, fileName } = splitKeyPackage(licenseKey);
  const response = await fetch(`/api/walrus/${encodeURIComponent(blobId)}`);
  if (!response.ok) {
    throw new Error("Walrus download failed");
  }
  const payload = new Uint8Array(await response.arrayBuffer());
  if (walrusHashHex && isProbableHex(walrusHashHex)) {
    const computed = bytesToHex(sha3_256(payload));
    const normalizedStored = walrusHashHex.startsWith("0x")
      ? walrusHashHex.slice(2)
      : walrusHashHex;
    if (computed !== normalizedStored) {
      console.warn(
        `[walrus] hash mismatch blob=${blobId} expected=${normalizedStored} actual=${computed}`,
      );
    }
  }
  if (payload.length < 28) {
    throw new Error("Walrus response payload is invalid");
  }
  const authTag = payload.slice(12, 28);
  const ciphertext = payload.slice(28);
  const cipherWithTag = concatBytes(ciphertext, authTag);
  const cipherBuffer = cipherWithTag.buffer.slice(
    cipherWithTag.byteOffset,
    cipherWithTag.byteOffset + cipherWithTag.byteLength,
  ) as ArrayBuffer;
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    key,
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"],
  );
  const plaintext = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: nonce },
    cryptoKey,
    cipherBuffer,
  );
  const blob = new Blob([plaintext]);
  const url = URL.createObjectURL(blob);
  const name = fileName || `${blobId.slice(0, 8)}-${Date.now()}.bin`;
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function splitKeyPackage(pkg: Uint8Array) {
  if (pkg.length < 46) {
    throw new Error("Key package format is invalid");
  }
  const nonce = pkg.slice(0, 12);
  const key = pkg.slice(12, 44);
  const nameLenData = pkg.slice(44, 46);
  const nameLen = new DataView(nameLenData.buffer).getUint16(0, true);
  const nameBytes = pkg.slice(46, 46 + nameLen);
  const fileName = nameBytes.length ? utf8FromBytes(nameBytes) : "";
  return { nonce, key, fileName };
}

function isProbableHex(value: string) {
  const normalized = value.startsWith("0x") ? value.slice(2) : value;
  return normalized.length % 2 === 0 && /^[0-9a-fA-F]+$/.test(normalized);
}
