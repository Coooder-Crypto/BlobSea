'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Box, Button, Flex, Heading } from "@radix-ui/themes";
import { ConnectButton, useCurrentAccount } from "@mysten/dapp-kit";

const navLinks = [
  { label: "落地页", href: "/" },
  { label: "发送", href: "/sell" },
  { label: "购买", href: "/buy" },
];

export default function HeaderNav() {
  const currentAccount = useCurrentAccount();
  const pathname = usePathname();

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
        <Flex align="center" gap="4" wrap="wrap">
          <Heading>BlobSea</Heading>
          <nav style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`nav-link${isActive ? " is-active" : ""}`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </Flex>
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
