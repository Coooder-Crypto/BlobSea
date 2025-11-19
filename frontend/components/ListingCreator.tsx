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
      setStatus({ state: "error", message: "名称不能为空" });
      return;
    }
    if (nameBytes.length > 128) {
      setStatus({ state: "error", message: "名称长度不能超过 128 字节" });
      return;
    }
    if (descriptionBytes.length > 2048) {
      setStatus({ state: "error", message: "介绍长度不能超过 2048 字节" });
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
        <Heading size="4">上传 + 上架（一步完成）</Heading>
        <Text color="gray">
          选择数据文件、填写名称与价格，BlobSea 会自动加密上传到 Walrus 并立即把 manifest
          写入链上创建 Listing。高级设置可配置 Epoch、Permanent 以及 send_object_to。
        </Text>

        <Flex gap="3" align="center">
          <Box flexGrow="1">
            <Text weight="bold">数据名称</Text>
            <TextField.Root
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="例如：2024-Q1 DEX Snapshot"
            />
          </Box>
          <Box flexGrow="1">
            <Text weight="bold">价格（SUI）</Text>
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
            <Text weight="bold">选择数据文件</Text>
            <input
              type="file"
              onChange={(event) => {
                setManifest(null);
                setFile(event.target.files?.[0] ?? null);
              }}
            />
            {file && (
              <Text size="2" color="gray">
                已选择：{file.name}（{formatBytes(file.size)}）
              </Text>
            )}
          </Box>
          <Box flexGrow="1">
            <Text weight="bold">许可条款文件（可选）</Text>
            <input
              type="file"
              onChange={(event) => {
                setManifest(null);
                setTermsFile(event.target.files?.[0] ?? null);
              }}
            />
            <Text size="2" color="gray">不上传会使用默认条款哈希。</Text>
          </Box>
        </Flex>

        <Separator my="1" size="4" />
        <Heading size="3">高级设置</Heading>
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
              send_object_to {currentAddress ? shorten(currentAddress) : "(连接钱包启用)"}
            </label>
          </Box>
        </Flex>

        <Separator my="1" size="4" />
        <Flex gap="3" align="center">
          <Box flexGrow="1">
            <Text weight="bold">数据简介</Text>
            <TextArea
              minRows={3}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="说明数据内容、格式、采集时间等（选填）"
            />
          </Box>
          <Box>
            <Text weight="bold">Marketplace ID</Text>
            <Text size="2" color="gray">
              {marketplaceId || "未配置，请设置 NEXT_PUBLIC_MARKETPLACE_ID"}
            </Text>
          </Box>
        </Flex>

        <Button onClick={handleSubmit} disabled={!canSubmit}>
          {status.state === "uploading"
            ? "加密并上传..."
            : status.state === "submitting"
              ? "写入链上..."
              : "上传并上架"}
        </Button>

        {status.state === "idle" && (
          <Text size="2" color="gray">
            Walrus 上传成功后会缓存 manifest，若链上提交失败可直接重试（无需再次上传）。
          </Text>
        )}
        {status.state === "uploading" && (
          <Text size="2" color="gray">
            本地加密并上传到 Walrus 中...
          </Text>
        )}
        {status.state === "submitting" && (
          <Text size="2" color="gray">
            Walrus 已完成，正在向链上写入 Listing...
          </Text>
        )}
        {status.state === "success" && (
          <Text color="green" size="2">
            <a href={getExplorerTxUrl(status.digest)} target="_blank" rel="noreferrer">
              交易成功，查看区块链记录
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
            <Heading size="3">最新 Manifest</Heading>
            <TextArea readOnly value={manifestJson} minRows={8} />
            <Text size="2" color="gray">
              Walrus BlobId: {manifest.blobId || "(未返回)"}
            </Text>
            <Text size="2" color="gray">Terms hash: {manifest.termsHash}</Text>
            {manifest.suiBlobObjectId && (
              <Text size="2" color="gray">
                链上 Blob Object: {manifest.suiBlobObjectId}
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
      throw new Error("Walrus 未返回 blobId");
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
                message: error instanceof Error ? error.message : "等待上链时出错",
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
    throw new Error("价格必须大于 0");
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
  throw new Error("Walrus 哈希必须是十六进制字符串");
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
