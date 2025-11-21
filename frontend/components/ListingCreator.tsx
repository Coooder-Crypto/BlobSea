'use client';

import { useState } from "react";
import {
  Box,
  Button,
  Card,
  Flex,
  Heading,
  Separator,
  Text,
  TextArea,
  TextField,
} from "@radix-ui/themes";
import { useSignAndExecuteTransaction, useSuiClient } from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { bcs } from "@mysten/sui/bcs";

import { Manifest, buildKeyPackage, encryptAndUpload } from "@/lib/walrus";
import { useNetworkVariable } from "@/lib/networkConfig";
import { hexToBytes } from "@/lib/bytes";

type Status =
  | { state: "idle" }
  | { state: "uploading" }
  | { state: "submitting" }
  | { state: "success"; digest: string }
  | { state: "error"; message: string };

type Props = {
  currentAddress?: string;
};

const SUI_TYPE = "0x2::sui::SUI";
const PAYMENT_METHOD_DIRECT_SUI = 0;

export default function ListingCreator({ currentAddress }: Props) {
  const marketplacePackageId = useNetworkVariable("marketplacePackageId");
  const marketplaceId = useNetworkVariable("marketplaceId");
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  const suiClient = useSuiClient();

  const [file, setFile] = useState<File | null>(null);
  const [termsFile, setTermsFile] = useState<File | null>(null);
  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [priceSui, setPriceSui] = useState("0.1");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [epochs, setEpochs] = useState(1);
  const [permanent, setPermanent] = useState(false);
  const [sendObjectToSelf, setSendObjectToSelf] = useState(true);
  const [status, setStatus] = useState<Status>({ state: "idle" });

  const manifestJson = manifest ? JSON.stringify(manifest, null, 2) : "";

  const canSubmit =
    Boolean(currentAddress) &&
    Boolean(file) &&
    marketplacePackageId &&
    marketplaceId &&
    Number(priceSui) > 0 &&
    title.trim().length > 0 &&
    status.state !== "uploading" &&
    status.state !== "submitting";

  const handleSubmit = async () => {
    if (!file || !canSubmit || !marketplacePackageId || !marketplaceId) return;
    const trimmedTitle = title.trim();
    const descriptionText = description.trim();
    const nameBytes = stringToBytes(trimmedTitle);
    const descriptionBytes = stringToBytes(descriptionText);
    if (nameBytes.length === 0) {
      setStatus({ state: "error", message: "Name must not be empty" });
      return;
    }
    if (nameBytes.length > 128) {
      setStatus({ state: "error", message: "Name must be 128 bytes or fewer" });
      return;
    }
    if (descriptionBytes.length > 2048) {
      setStatus({
        state: "error",
        message: "Description must be 2048 bytes or fewer",
      });
      return;
    }

    let activeManifest = manifest;
    if (!activeManifest) {
      setStatus({ state: "uploading" });
      try {
        const query: Record<string, string | number | boolean> = { epochs };
        if (permanent) {
          query.permanent = true;
        }
        if (sendObjectToSelf && currentAddress) {
          query.send_object_to = currentAddress;
        }
        const uploadResult = await encryptAndUpload(file, {
          termsFile,
          query,
        });
        activeManifest = uploadResult.manifest;
        setManifest(activeManifest);
      } catch (error) {
        setStatus({
          state: "error",
          message: error instanceof Error ? error.message : String(error),
        });
        return;
      }
    }

    submitListing({
      manifest: activeManifest,
      descriptionBytes,
      nameBytes,
      priceSui,
      marketplaceId,
      marketplacePackageId,
      signAndExecute,
      suiClient,
      setStatus,
    });
  };

  return (
    <Card>
      <Flex direction="column" gap="3">
        <Heading size="4">Upload + publish (single step)</Heading>
        <Text color="gray">
          Pick your dataset, add a title and price, and BlobSea encrypts to Walrus then
          writes the manifest on-chain immediately. Advanced options let you tweak epochs,
          permanence, and send_object_to.
        </Text>

        <Flex gap="3" align="center">
          <Box flexGrow="1">
            <Text weight="bold">Dataset name</Text>
            <TextField.Root
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="e.g. 2024-Q1 DEX Snapshot"
            />
          </Box>
          <Box flexGrow="1">
            <Text weight="bold">Price (SUI)</Text>
            <TextField.Root
              type="number"
              min="0"
              step="0.000000001"
              value={priceSui}
              onChange={(event) => setPriceSui(event.target.value)}
            />
          </Box>
        </Flex>

        <Flex gap="3" align="center">
          <Box flexGrow="1">
            <Text weight="bold">Select data file</Text>
            <input
              type="file"
              onChange={(event) => {
                setManifest(null);
                setFile(event.target.files?.[0] ?? null);
              }}
            />
            {file && (
              <Text size="2" color="gray">
                Selected: {file.name} ({formatBytes(file.size)})
              </Text>
            )}
          </Box>
          <Box flexGrow="1">
            <Text weight="bold">License terms file (optional)</Text>
            <input
              type="file"
              onChange={(event) => {
                setManifest(null);
                setTermsFile(event.target.files?.[0] ?? null);
              }}
            />
            <Text size="2" color="gray">Leave empty to use the default terms hash.</Text>
          </Box>
        </Flex>

        <Separator my="1" size="4" />
        <Heading size="3">Advanced settings</Heading>
        <Flex gap="3" align="center">
          <Box>
            <Text weight="bold">Walrus Epochs</Text>
            <TextField.Root
              type="number"
              min="1"
              value={String(epochs)}
              onChange={(event) => {
                const next = Math.max(1, Number(event.target.value) || 1);
                setEpochs(next);
                setManifest(null);
              }}
              style={{ maxWidth: 160 }}
            />
          </Box>
          <Box>
            <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <input
                type="checkbox"
                checked={permanent}
                onChange={(event) => {
                  setPermanent(event.target.checked);
                  setManifest(null);
                }}
              />
              Permanent
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <input
                type="checkbox"
                checked={sendObjectToSelf}
                onChange={(event) => {
                  setSendObjectToSelf(event.target.checked);
                  setManifest(null);
                }}
                disabled={!currentAddress}
              />
              send_object_to{" "}
              {currentAddress ? shorten(currentAddress) : "(connect wallet to enable)"}
            </label>
          </Box>
        </Flex>

        <Separator my="1" size="4" />
        <Flex gap="3" align="center">
          <Box flexGrow="1">
            <Text weight="bold">Dataset description</Text>
            <TextArea
              minRows={3}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Describe content, format, timeframe, etc. (optional)"
            />
          </Box>
          <Box>
            <Text weight="bold">Marketplace ID</Text>
            <Text size="2" color="gray">
              {marketplaceId || "Not configured. Set NEXT_PUBLIC_MARKETPLACE_ID."}
            </Text>
          </Box>
        </Flex>

        <Button onClick={handleSubmit} disabled={!canSubmit}>
          {status.state === "uploading"
            ? "Encrypting & uploading..."
            : status.state === "submitting"
              ? "Committing on chain..."
              : "Upload and publish"}
        </Button>

        {status.state === "idle" && (
          <Text size="2" color="gray">
            Walrus uploads cache the manifest. If the on-chain transaction fails you can
            retry without uploading again.
          </Text>
        )}
        {status.state === "uploading" && (
          <Text size="2" color="gray">
            Encrypting locally and uploading to Walrus...
          </Text>
        )}
        {status.state === "submitting" && (
          <Text size="2" color="gray">
            Walrus upload done. Writing the listing on chain...
          </Text>
        )}
        {status.state === "success" && (
          <Text color="green" size="2">
            <a href={getExplorerTxUrl(status.digest)} target="_blank" rel="noreferrer">
              Transaction succeeded — view the record
            </a>
          </Text>
        )}
        {status.state === "error" && (
          <Text color="red" size="2">
            {status.message}
          </Text>
        )}

        {manifest && (
          <>
            <Separator my="2" />
            <Heading size="3">Latest manifest</Heading>
            <TextArea readOnly value={manifestJson} minRows={8} />
            <Text size="2" color="gray">
              Walrus BlobId: {manifest.blobId || "(not returned)"}
            </Text>
            <Text size="2" color="gray">Terms hash: {manifest.termsHash}</Text>
            {manifest.suiBlobObjectId && (
              <Text size="2" color="gray">
                On-chain blob object: {manifest.suiBlobObjectId}
              </Text>
            )}
          </>
        )}
      </Flex>
    </Card>
  );
}

type SubmitArgs = {
  manifest: Manifest;
  descriptionBytes: Uint8Array;
  nameBytes: Uint8Array;
  priceSui: string;
  marketplaceId: string;
  marketplacePackageId: string;
  signAndExecute: ReturnType<typeof useSignAndExecuteTransaction>["mutate"];
  suiClient: ReturnType<typeof useSuiClient>;
  setStatus: (status: Status) => void;
};

function submitListing({
  manifest,
  descriptionBytes,
  nameBytes,
  priceSui,
  marketplaceId,
  marketplacePackageId,
  signAndExecute,
  suiClient,
  setStatus,
}: SubmitArgs) {
  try {
    const tx = new Transaction();
    const priceMist = toMist(priceSui);
    const walrusBlobId = stringToBytes(manifest.blobId ?? "");
    if (walrusBlobId.length === 0) {
      throw new Error("Walrus did not return a blobId");
    }
    const walrusHashBytes = toHashBytes(manifest.walrusHash, manifest.contentHash);
    const termsBytes = hexToBytes(manifest.termsHash);
    const keyBytes = buildKeyPackage(
      hexToBytes(manifest.keyHex),
      hexToBytes(manifest.nonceHex),
      manifest.sourceFileName,
    );

    tx.moveCall({
      target: `${marketplacePackageId}::marketplace::create_listing`,
      typeArguments: [SUI_TYPE],
      arguments: [
        tx.object(marketplaceId),
        tx.pure.u64(priceMist),
        tx.pure(pureVectorBytes(nameBytes)),
        tx.pure(pureVectorBytes(descriptionBytes)),
        tx.pure(pureVectorBytes(walrusBlobId)),
        tx.pure(pureVectorBytes(walrusHashBytes)),
        tx.pure(pureVectorBytes(termsBytes)),
        tx.pure(pureVectorBytes(keyBytes)),
        tx.pure.u8(PAYMENT_METHOD_DIRECT_SUI),
      ],
    });

    setStatus({ state: "submitting" });
    signAndExecute(
      { transaction: tx },
      {
        onSuccess: (result) => {
          suiClient
            .waitForTransaction({ digest: result.digest })
            .then(() => setStatus({ state: "success", digest: result.digest }))
            .catch((error) =>
              setStatus({
                state: "error",
                message:
                  error instanceof Error ? error.message : "Error while waiting for on-chain confirmation",
              }),
            );
        },
        onError: (error) =>
          setStatus({
            state: "error",
            message: error instanceof Error ? error.message : String(error),
          }),
      },
    );
  } catch (error) {
    setStatus({
      state: "error",
      message: error instanceof Error ? error.message : String(error),
    });
  }
}

function toMist(value: string): bigint {
  const numeric = Number(value);
  if (!isFinite(numeric) || numeric <= 0) {
    throw new Error("Price must be greater than 0");
  }
  return BigInt(Math.floor(numeric * 1_000_000_000));
}

function stringToBytes(value: string) {
  return new TextEncoder().encode(value ?? "");
}

function toHashBytes(primary?: string | null, fallback?: string | null) {
  const value = primary ?? fallback ?? "";
  if (!value) return new Uint8Array();
  if (isHex(value)) {
    return hexToBytes(value);
  }
  if (primary && fallback && primary !== fallback) {
    return toHashBytes(fallback, null);
  }
  throw new Error("Walrus hash must be a hex string");
}

function isHex(value: string) {
  const normalized = value.startsWith("0x") ? value.slice(2) : value;
  return /^[0-9a-fA-F]+$/.test(normalized);
}

function pureVectorBytes(bytes: Uint8Array) {
  return bcs.vector(bcs.u8()).serialize(Array.from(bytes)).toBytes();
}

function getExplorerTxUrl(digest: string) {
  return `https://suiexplorer.com/txblock/${digest}?network=testnet`;
}

function formatBytes(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const index = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  const value = bytes / Math.pow(1024, index);
  return `${value.toFixed(2)} ${units[index]}`;
}

function shorten(value: string, length = 6) {
  if (value.length <= length * 2) return value;
  return `${value.slice(0, length)}...${value.slice(-length)}`;
}
