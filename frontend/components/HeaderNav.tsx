'use client';

import { Box, Button, Flex, Heading } from "@radix-ui/themes";
import { ConnectButton, useCurrentAccount } from "@mysten/dapp-kit";

export default function HeaderNav() {
  const currentAccount = useCurrentAccount();

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 10,
        borderBottom: "1px solid var(--gray-a2)",
        background: "var(--color-panel-solid)",
      }}
    >
      <Flex
        direction="row"
        justify="between"
        align="center"
        px="4"
        py="2"
        style={{ maxWidth: 1200, margin: "0 auto" }}
      >
        <Heading>BlobSea</Heading>
        <Box style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {currentAccount && (
            <Button
              variant="soft"
              onClick={() =>
                window.open(
                  `https://faucet.sui.io/?address=${currentAccount.address}`,
                  "_blank",
                )
              }
            >
              获取测试网 SUI
            </Button>
          )}
          <ConnectButton />
        </Box>
      </Flex>
    </header>
  );
}
