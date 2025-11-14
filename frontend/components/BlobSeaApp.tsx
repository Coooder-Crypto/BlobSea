'use client';

import {
  Card,
  Container,
  Flex,
  Heading,
  Separator,
  Text,
} from "@radix-ui/themes";
import { useCurrentAccount } from "@mysten/dapp-kit";
import SellerUploader from "@/components/SellerUploader";
import ListingCreator from "@/components/ListingCreator";
import ListingGallery from "@/components/ListingGallery";
import LicenseInventory from "@/components/LicenseInventory";

const sellerSteps = [
  {
    title: "浏览器加密",
    detail: "使用下方上传器选择文件，客户端会在浏览器内完成 AES-GCM 加密。",
  },
  {
    title: "Walrus 上传",
    detail: "上传器调用 Next.js API 代理到 Walrus，返回 blobId 与 hash。",
  },
  {
    title: "链上上架（即将上线）",
    detail: "使用 manifest 数据调用 Move 合约 `create_listing`，登记价格与条款。",
  },
];

const buyerSteps = [
  {
    title: "连接钱包",
    detail: "使用右上角 ConnectButton 连接 Sui 钱包，未来可直接在此处购买。",
  },
  {
    title: "获取 License（待实现）",
    detail: "链上支付后将获得 License 对象和 Walrus Capability。",
  },
  {
    title: "下载并解密",
    detail: "使用 `pnpm download:decrypt <manifest>` 调用 API 拉取密文并在本地解密。",
  },
];

const cliExamples = [
  "pnpm encrypt:upload ./data/training.csv",
  "pnpm download:decrypt ./data/training.csv.manifest.json ./training.dec.csv",
];

export default function BlobSeaApp() {
  const currentAccount = useCurrentAccount();

  return (
    <Container size="3" mt="5" px="4" pb="6">
      <Heading size="6" mb="2">
        BlobSea 流程总览
      </Heading>
      <Text color="gray">
        这是 BlobSea 前端版 Walrus 上传向导。卖家可以在浏览器内加密并上传，随后将产出的 manifest 喂给链上 `create_listing`。
      </Text>

      <Separator my="4" />

      <SellerUploader currentAddress={currentAccount?.address} />

      <Separator my="4" />

      {currentAccount ? (
        <ListingCreator currentAddress={currentAccount.address} />
      ) : (
        <Card>
          <Heading size="4">链上上架</Heading>
          <Text color="gray">
            连接钱包后即可将 manifest 提交到链上 `create_listing`。
          </Text>
        </Card>
      )}

      <Separator my="4" />

      <Flex direction={{ initial: "column", md: "row" }} gap="4">
        <Card style={{ flex: 1 }}>
          <Heading size="4" mb="2">
            卖家后续步骤
          </Heading>
          <Flex direction="column" gap="3">
            {sellerSteps.map((step) => (
              <div key={step.title}>
                <Text weight="bold">{step.title}</Text>
                <Text color="gray">{step.detail}</Text>
              </div>
            ))}
          </Flex>
        </Card>

        <Card style={{ flex: 1 }}>
          <Heading size="4" mb="2">
            买家流程
          </Heading>
          <Flex direction="column" gap="3">
            {buyerSteps.map((step) => (
              <div key={step.title}>
                <Text weight="bold">{step.title}</Text>
                <Text color="gray">{step.detail}</Text>
              </div>
            ))}
          </Flex>
        </Card>
      </Flex>

      <Separator my="4" />

      <Card>
        <Heading size="4" mb="2">
          CLI 仍可用
        </Heading>
        <Text color="gray" mb="2">
          如需自动化或批处理，可继续使用脚本：
        </Text>
        <Flex direction="column" gap="2">
          {cliExamples.map((cmd) => (
            <code key={cmd} style={{ background: "var(--gray-a3)", padding: "8px", borderRadius: 8 }}>
              {cmd}
            </code>
          ))}
        </Flex>
        <Text mt="3" color="gray">
          当前连接钱包：{currentAccount ? currentAccount.address : "未连接"}
        </Text>
      </Card>

      <Separator my="4" />

      <ListingGallery currentAddress={currentAccount?.address} />

      <Separator my="4" />

      <LicenseInventory currentAddress={currentAccount?.address} />
    </Container>
  );
}
