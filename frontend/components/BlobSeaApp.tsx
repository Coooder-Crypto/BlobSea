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

export default function BlobSeaApp() {
  const currentAccount = useCurrentAccount();

  return (
    <Container size="3" mt="5" px="4" pb="6">
      <Heading size="6" mb="2">
        BlobSea
      </Heading>
      <Text color="gray">
        上传 Walrus → 上链上架 → 购买 License → 下载解密，全流程都在这个页面完成。
      </Text>

      <Separator my="4" />

      <Flex direction="column" gap="4">
        <SellerUploader currentAddress={currentAccount?.address} />

        {currentAccount ? (
          <ListingCreator currentAddress={currentAccount.address} />
        ) : (
          <Card>
            <Heading size="4">链上上架</Heading>
            <Text color="gray">连接钱包后即可提交 manifest 创建 Listing。</Text>
          </Card>
        )}

        <ListingGallery currentAddress={currentAccount?.address} />
        <LicenseInventory currentAddress={currentAccount?.address} />
      </Flex>
    </Container>
  );
}
