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

import ListingGallery from "@/components/ListingGallery";
import LicenseInventory from "@/components/LicenseInventory";

export default function BuyView() {
  const currentAccount = useCurrentAccount();

  return (
    <Container size="4" px="4" py="6">
      <Flex direction="column" gap="5">
        <Box>
          <Badge variant="soft" color="green">
            购买数据
          </Badge>
          <Heading size="7" mt="2" mb="2">
            购买者工作台
          </Heading>
          <Text color="gray" size="4">
            浏览来自 Walrus 的数据 Listing，完成支付后可立即在 License
            区块中解密取回。流程保持透明，状态一目了然。
          </Text>
          <Box mt="3">
            <Button variant="surface" asChild>
              <Link href="/sell">我要发送我的数据</Link>
            </Button>
          </Box>
        </Box>

        <Card className="workspace-card" size="3">
          <Flex direction="column" gap="4">
            <Box>
              <Heading size="5" mb="1">
                浏览 Listing 并解密
              </Heading>
              <Text color="gray">
                如果是首次购买，请切换到测试网钱包并准备 SUI；BlobSea
                会在链上完成支付并在 License 清单中展示可下载项。
              </Text>
            </Box>

            <Separator size="4" />

            <ListingGallery currentAddress={currentAccount?.address} />
            <LicenseInventory currentAddress={currentAccount?.address} />
          </Flex>
        </Card>
      </Flex>
    </Container>
  );
}
