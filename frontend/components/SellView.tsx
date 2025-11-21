'use client';

import Link from "next/link";
import {
  Badge,
  Box,
  Button,
  Card,
  Container,
  Flex,
  Heading,
  Separator,
  Text,
} from "@radix-ui/themes";
import { useCurrentAccount } from "@mysten/dapp-kit";

import ListingCreator from "@/components/ListingCreator";

export default function SellView() {
  const currentAccount = useCurrentAccount();

  return (
    <Container size="4" px="4" py="6">
      <Flex direction="column" gap="5">
        <Box>
          <Badge variant="soft" color="blue">
            发送数据
          </Badge>
          <Heading size="7" mt="2" mb="2">
            发送者工作台
          </Heading>
          <Text color="gray" size="4">
            上传文件时自动进行 Walrus 加密存储，并为你生成 Manifest
            写入链上 Listing。保持流程简单但透明。
          </Text>
          <Box mt="3">
            <Button variant="surface" asChild>
              <Link href="/buy">想查看所有 Listing？</Link>
            </Button>
          </Box>
        </Box>

        <Card className="workspace-card" size="3">
          <Flex direction="column" gap="4">
            <Box>
              <Heading size="5" mb="1">
                上传＋上架（一步完成）
              </Heading>
              <Text color="gray">
                维持在 Walrus 与 Sui 必需字段：数据文件、许可条款、价格、描述。需要高级参数时可配置 epoch
                与 permanent。
              </Text>
            </Box>

            <Separator size="4" />

            {currentAccount ? (
              <ListingCreator currentAddress={currentAccount.address} />
            ) : (
              <Card variant="surface">
                <Heading size="4">连接钱包即可开始</Heading>
                <Text color="gray">
                  点击右上角 Connect Wallet，BlobSea 会在你授权后自动执行上传与交易。
                </Text>
              </Card>
            )}
          </Flex>
        </Card>
      </Flex>
    </Container>
  );
}
