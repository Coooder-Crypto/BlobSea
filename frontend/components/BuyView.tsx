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
            Buy Data
          </Badge>
          <Heading size="7" mt="2" mb="2">
            Buyer Workspace
          </Heading>
          <Text color="gray" size="4">
            Browse listings backed by Walrus, purchase in one click, and decrypt via your
            license inventory immediately afterward.
          </Text>
          <Box mt="3">
            <Button variant="surface" asChild>
              <Link href="/sell">I want to sell my data</Link>
            </Button>
          </Box>
        </Box>

        <Card className="workspace-card" size="3">
          <Flex direction="column" gap="4">
            <Box>
              <Heading size="5" mb="1">
                Browse listings and decrypt
              </Heading>
              <Text color="gray">
                First time purchasing? Switch to a Sui testnet wallet and keep enough SUI
                handy. BlobSea will handle the on-chain payment and surface downloadable
                entries inside your license list.
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
