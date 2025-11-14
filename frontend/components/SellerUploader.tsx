'use client';

import { useMemo, useState } from "react";
import {
  Box,
  Button,
  Card,
  Flex,
  Heading,
  Separator,
  Text,
  TextArea,
} from "@radix-ui/themes";
import { DownloadIcon } from "@radix-ui/react-icons";

import { Manifest, encryptAndUpload, manifestToBlob } from "@/lib/walrus";

type Status =
  | { state: "idle" }
  | { state: "encrypting" }
  | { state: "done" }
  | { state: "error"; message: string };

type Props = {
  currentAddress?: string;
};

export default function SellerUploader({ currentAddress }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [termsFile, setTermsFile] = useState<File | null>(null);
  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [status, setStatus] = useState<Status>({ state: "idle" });
  const [epochs, setEpochs] = useState(1);
  const [sendObject, setSendObject] = useState(true);
  const [permanent, setPermanent] = useState(false);

  const manifestJson = useMemo(
    () => (manifest ? JSON.stringify(manifest, null, 2) : ""),
    [manifest],
  );

  const disabled = !file || status.state === "encrypting";

  const handleUpload = async () => {
    if (!file) return;
    try {
      setStatus({ state: "encrypting" });
      const query: Record<string, string | number | boolean> = {
        epochs,
      };
      if (permanent) {
        query.permanent = true;
      }
      if (sendObject && currentAddress) {
        query.send_object_to = currentAddress;
      }
      const { manifest: createdManifest } = await encryptAndUpload(file, {
        termsFile,
        query,
      });
      setManifest(createdManifest);
      setStatus({ state: "done" });
    } catch (error) {
      setStatus({
        state: "error",
        message: error instanceof Error ? error.message : String(error),
      });
    }
  };

  const handleDownloadManifest = () => {
    if (!manifest) return;
    const blob = manifestToBlob(manifest);
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const sanitizedName = manifest.sourceFileName
      ? manifest.sourceFileName.replace(/\s+/g, "_")
      : "blobsea";
    link.href = url;
    link.download = `${sanitizedName}.manifest.json`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 500);
  };

  return (
    <Card>
      <Flex direction="column" gap="3">
        <Heading size="4">卖家上传（前端版）</Heading>
        <Text color="gray">
          在浏览器内完成加密并将密文上传到 Walrus。完成后可下载 manifest，用于链上上架。
        </Text>

        <Flex direction={{ initial: "column", sm: "row" }} gap="3">
          <Box flexGrow="1">
            <Text weight="bold">选择数据文件</Text>
            <input
              type="file"
              onChange={(event) => {
                setManifest(null);
                setFile(event.target.files?.[0] ?? null);
              }}
            />
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
          </Box>
        </Flex>

        <Flex direction={{ initial: "column", sm: "row" }} gap="3">
          <Box>
            <Text weight="bold">存储 Epoch</Text>
            <input
              type="number"
              min={1}
              value={epochs}
              onChange={(event) => setEpochs(Math.max(1, Number(event.target.value)))}
            />
          </Box>
          <Box>
            <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <input
                type="checkbox"
                checked={permanent}
                onChange={(event) => setPermanent(event.target.checked)}
              />
              Permanent
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <input
                type="checkbox"
                checked={sendObject}
                onChange={(event) => setSendObject(event.target.checked)}
                disabled={!currentAddress}
              />
              send_object_to {currentAddress ? currentAddress : "(连接钱包可启用)"}
            </label>
          </Box>
        </Flex>

        <Button onClick={handleUpload} disabled={disabled} variant="surface">
          {status.state === "encrypting" ? "处理中..." : "加密并上传"}
        </Button>

        {status.state === "done" && (
          <Text color="green" size="2">
            上传成功，已生成 manifest。
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
            <Flex align="center" justify="between">
              <Heading size="3">Manifest</Heading>
              <Button
                variant="soft"
                onClick={handleDownloadManifest}
                size="2"
              >
                <DownloadIcon /> 下载 JSON
              </Button>
            </Flex>
            <TextArea readOnly value={manifestJson} minRows={8} />
            {manifest.suiBlobObjectId && (
              <Text size="2" color="gray">
                链上 Blob Object ID: {manifest.suiBlobObjectId}
              </Text>
            )}
          </>
        )}
      </Flex>
    </Card>
  );
}
