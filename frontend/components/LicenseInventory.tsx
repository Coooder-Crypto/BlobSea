'use client';

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  Card,
  Flex,
  Heading,
  Text,
  Button,
} from "@radix-ui/themes";
import { useSuiClient } from "@mysten/dapp-kit";
import { sha3_256 } from "@noble/hashes/sha3";

import { useNetworkVariable } from "@/lib/networkConfig";
import {
  bytesFromSui,
  bytesToHex,
  utf8FromBytes,
  concatBytes,
} from "@/lib/bytes";

type Props = {
  currentAddress?: string;
};

export default function LicenseInventory({ currentAddress }: Props) {
  const marketplacePackageId = useNetworkVariable("marketplacePackageId");
  const suiClient = useSuiClient();
  const [downloadStatus, setDownloadStatus] = useState<
    Record<
      string,
      | { state: "idle" }
      | { state: "pending" }
      | { state: "error"; message: string }
      | { state: "success" }
    >
  >({});

  const {
    data: licenses,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["blobsea-licenses", currentAddress, marketplacePackageId],
    enabled: Boolean(currentAddress && marketplacePackageId),
    queryFn: async () => {
      if (!currentAddress || !marketplacePackageId) return [];
      const structType = `${marketplacePackageId}::marketplace::License`;
      const response = await suiClient.getOwnedObjects({
        owner: currentAddress,
        filter: { StructType: structType },
        options: {
          showContent: true,
        },
      });
      return response.data.map((item) => {
        const fields = (item.data?.content as any)?.fields ?? {};
        return {
          objectId: item.data?.objectId ?? "",
          listingId: fields.listing_id ?? "",
          encryptedKey: bytesFromSui(fields.encrypted_key),
          grantedAt: Number(fields.granted_at ?? 0),
        };
      });
    },
    refetchInterval: 30_000,
  });

  return (
    <Card>
      <Flex direction="column" gap="3">
        <Flex align="center" justify="between">
          <Heading size="4">我的 License</Heading>
          <Button variant="soft" size="2" onClick={() => refetch()}>
            刷新
          </Button>
        </Flex>

        {!currentAddress && (
          <Text color="gray">连接钱包后可查看已购买的 License。</Text>
        )}
        {currentAddress && !marketplacePackageId && (
          <Text color="gray">请配置 Marketplace 包信息。</Text>
        )}

        {isLoading && currentAddress && <Text>加载中...</Text>}
        {error && (
          <Text color="red">
            获取 License 失败：
            {error instanceof Error ? error.message : String(error)}
          </Text>
        )}
        {licenses && licenses.length === 0 && (
          <Text color="gray">暂无 License，先购买一份 Listing。</Text>
        )}

        {licenses && licenses.length > 0 && (
          <Flex direction="column" gap="2">
            {licenses.map((license) => (
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
          </Flex>
        )}
      </Flex>
    </Card>
  );
}

type LicenseRecord = {
  objectId: string;
  listingId: string;
  encryptedKey: Uint8Array;
  grantedAt: number;
};

type LicenseCardProps = {
  license: LicenseRecord;
  suiClient: ReturnType<typeof useSuiClient>;
  status:
    | { state: "idle" }
    | { state: "pending" }
    | { state: "error"; message: string }
    | { state: "success" };
  onStatusChange: (
    status:
      | { state: "idle" }
      | { state: "pending" }
      | { state: "error"; message: string }
      | { state: "success" },
  ) => void;
};

function LicenseCard({ license, suiClient, status, onStatusChange }: LicenseCardProps) {
  const shortId = `${license.objectId.slice(0, 6)}...${license.objectId.slice(-4)}`;

  const handleDownload = async () => {
    onStatusChange({ state: "pending" });
    try {
      const listingObject = await suiClient.getObject({
        id: license.listingId,
        options: { showContent: true },
      });
      const listingFields = (listingObject.data?.content as any)?.fields;
      if (!listingFields) {
        throw new Error("无法读取 Listing 数据");
      }
      const blobBytes = bytesFromSui(listingFields.walrus_blob_id);
      const blobId = utf8FromBytes(blobBytes).trim();
      if (!blobId) {
        throw new Error("Listing 缺少 Walrus Blob ID");
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
            : "下载失败，请稍后重试",
      });
    }
  };

  return (
    <Card>
      <Flex direction="column" gap="2">
        <Text>License 对象：{shortId}</Text>
        <Text color="gray">Listing：{license.listingId}</Text>
        <Button
          variant="soft"
          onClick={handleDownload}
          disabled={status.state === "pending"}
        >
          {status.state === "pending" ? "下载中..." : "下载并解密"}
        </Button>
        {status.state === "error" && (
          <Text color="red" size="2">
            {status.message}
          </Text>
        )}
        {status.state === "success" && (
          <Text color="green" size="2">
            下载完成
          </Text>
        )}
      </Flex>
    </Card>
  );
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
    throw new Error("License 中缺少密钥数据");
  }
  const { nonce, key, fileName } = splitKeyPackage(licenseKey);
  const response = await fetch(`/api/walrus/${encodeURIComponent(blobId)}`);
  if (!response.ok) {
    throw new Error("Walrus 下载失败");
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
    throw new Error("Walrus 返回内容异常");
  }
  const authTag = payload.slice(12, 28);
  const ciphertext = payload.slice(28);
  const cipherWithTag = concatBytes(ciphertext, authTag);
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
    cipherWithTag,
  );
  const blob = new Blob([plaintext]);
  const url = URL.createObjectURL(blob);
  const filename = fileName || `${blobId.slice(0, 8)}-${Date.now()}.bin`;
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function splitKeyPackage(pkg: Uint8Array) {
  if (pkg.length < 46) {
    throw new Error("密钥包格式不正确");
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
