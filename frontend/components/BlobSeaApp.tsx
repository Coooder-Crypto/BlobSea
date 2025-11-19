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
import ListingCreator from "@/components/ListingCreator";
import ListingGallery from "@/components/ListingGallery";
import LicenseInventory from "@/components/LicenseInventory";

export default function BlobSeaApp() {
  const currentAccount = useCurrentAccount();

  return (
    <Container size="3" mt="5" px="4" pb="6">
      <Heading size="6" mb="2">
        BlobSea
      </Heading>
      <Text color="gray">
        加密上传 Walrus、写入链上 Listing、购买 License、解密下载——完整流程集中在此页面。
      </Text>

      <Separator my="4" />

      <Flex direction="column" gap="4">
        {currentAccount ? (
          <ListingCreator currentAddress={currentAccount.address} />
        ) : (
          <Card>
            <Heading size="4">上传 + 上架</Heading>
            <Text color="gray">连接钱包后即可上传文件并创建 Listing。</Text>
          </Card>
        )}

        <ListingGallery currentAddress={currentAccount?.address} />
        <LicenseInventory currentAddress={currentAccount?.address} />
      </Flex>
    </Container>
  );
}
