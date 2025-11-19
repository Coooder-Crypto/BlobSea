'use client';

import { ChangeEvent, useEffect, useState } from "react";
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

import { Manifest, buildKeyPackage } from "@/lib/walrus";
import { useNetworkVariable } from "@/lib/networkConfig";
import { hexToBytes } from "@/lib/bytes";

type Status =
  | { state: "idle" }
  | { state: "parsing"; message?: string }
  | { state: "ready" }
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

  const [manifestText, setManifestText] = useState("");
  const [manifestError, setManifestError] = useState<string | null>(null);
  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [priceSui, setPriceSui] = useState("0.1");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<Status>({ state: "idle" });

  useEffect(() => {
    if (!manifestText) {
      setManifest(null);
      setManifestError(null);
      return;
    }
    try {
      const parsed = JSON.parse(manifestText);
      validateManifest(parsed);
      setManifest(parsed);
      setManifestError(null);
    } catch (error) {
      setManifest(null);
      setManifestError(
        error instanceof Error ? error.message : "Manifest 解析失败",
      );
    }
  }, [manifestText]);

  const canSubmit =
    !!manifest &&
    !manifestError &&
    marketplacePackageId &&
    marketplaceId &&
    Number(priceSui) > 0 &&
    title.trim().length > 0 &&
    status.state !== "submitting";

  const handleManifestFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    setManifestText(text);
  };

  const handleSubmit = () => {
    if (!manifest || !canSubmit) return;
    try {
      const tx = new Transaction();
      const priceMist = toMist(priceSui);
      const trimmedTitle = title.trim();
      const descriptionText = description.trim();
      const nameBytes = stringToBytes(trimmedTitle);
      const descriptionBytes = stringToBytes(descriptionText);
      if (nameBytes.length === 0) {
        throw new Error("名称不能为空");
      }
      if (nameBytes.length > 128) {
        throw new Error("名称长度不能超过 128 字节");
      }
      if (descriptionBytes.length > 2048) {
        throw new Error("介绍长度不能超过 2048 字节");
      }

      const walrusBlobId = stringToBytes(manifest.blobId ?? "");
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
                    error instanceof Error
                      ? error.message
                      : "等待上链时出错",
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
  };

  return (
    <Card>
      <Flex direction="column" gap="3">
        <Heading size="4">链上上架</Heading>
        <Text color="gray">
          将 Walrus manifest 与价格写入 Move 合约，创建 Listing。请在下方粘贴
          manifest JSON 或从文件导入，并确认 price（SUI）。
        </Text>

        <Flex direction={{ initial: "column", sm: "row" }} gap="3">
          <Box flexGrow="1">
            <Text weight="bold">Manifest JSON</Text>
            <TextArea
              minRows={6}
              value={manifestText}
              onChange={(event) => setManifestText(event.target.value)}
              placeholder="粘贴 manifest JSON..."
            />
            {manifestError && (
              <Text color="red" size="2">
                {manifestError}
              </Text>
            )}
          </Box>
          <Box>
            <Text weight="bold">导入文件</Text>
            <input type="file" accept="application/json" onChange={handleManifestFile} />
          </Box>
        </Flex>

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
          {status.state === "submitting" ? "提交中..." : "提交 Listing"}
        </Button>

        {status.state === "success" && (
          <Text color="green" size="2">
            <a
              href={getExplorerTxUrl(status.digest)}
              target="_blank"
              rel="noreferrer"
            >
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
            <Heading size="3">预览</Heading>
            {title.trim() && (
              <Text size="2" color="gray">
                名称：{title.trim()}
              </Text>
            )}
            {description.trim() && (
              <Text size="2" color="gray">
                简介：{description.trim()}
              </Text>
            )}
            <Text size="2" color="gray">
              BlobId: {manifest.blobId}
            </Text>
            <Text size="2" color="gray">
              Terms hash: {manifest.termsHash}
            </Text>
            <Text size="2" color="gray">
              Key hex: {manifest.keyHex?.slice(0, 20)}...
            </Text>
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

function validateManifest(data: any) {
  const required = ["blobId", "keyHex", "termsHash"];
  required.forEach((field) => {
    if (!data[field]) throw new Error(`Manifest 缺少字段: ${field}`);
  });
}

function getExplorerTxUrl(digest: string) {
  return `https://suiexplorer.com/txblock/${digest}?network=testnet`;
}
