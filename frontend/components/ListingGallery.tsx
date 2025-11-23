"use client";

import { useMemo, useState, type ReactNode } from "react";
import { Button, Card, Flex, Heading, Text } from "@radix-ui/themes";
import { useSignAndExecuteTransaction, useSuiClient } from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";

import ItemCard, { type PurchaseStatus } from "@/components/ItemCard";
import {
  useMarketplaceListings,
  type ListingEvent,
} from "@/hooks/useMarketplaceListings";

const SUI_TYPE = "0x2::sui::SUI";

type Props = {
  currentAddress?: string;
};

export default function ListingGallery({ currentAddress }: Props) {
  const suiClient = useSuiClient();
  const {
    listings,
    isLoading,
    error,
    refetch,
    marketplaceId,
    marketplacePackageId,
  } = useMarketplaceListings();

  const content = useMemo(() => {
    if (!marketplacePackageId || !marketplaceId) {
      return (
        <Text color="gray">
          Configure `NEXT_PUBLIC_MARKETPLACE_PACKAGE_ID` and
          `NEXT_PUBLIC_MARKETPLACE_ID` in your environment first.
        </Text>
      );
    }

    if (isLoading) return <Text>Loading...</Text>;
    if (error)
      return (
        <Text color="red">
          Failed to load listings: {error instanceof Error ? error.message : String(error)}
        </Text>
      );
    if (!listings || listings.length === 0) {
      return <Text color="gray">No listings yet. Upload a file and publish it first.</Text>;
    }

    return (
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {listings.map((listing) => (
          <ListingCard
            key={listing.listingId}
            listing={listing}
            marketplacePackageId={marketplacePackageId}
            marketplaceId={marketplaceId}
            currentAddress={currentAddress}
          />
        ))}
      </div>
    );
  }, [
    marketplacePackageId,
    marketplaceId,
    listings,
    isLoading,
    error,
    currentAddress,
  ]);

  return (
    <Card>
      <Flex direction="column" gap="3">
        <Flex align="center" justify="between">
          <Heading size="4">Live Listings</Heading>
          <Button variant="soft" size="2" onClick={() => refetch()}>
            Refresh
          </Button>
        </Flex>
        {content}
      </Flex>
    </Card>
  );
}

export function ListingCard({
  listing,
  marketplacePackageId,
  marketplaceId,
  currentAddress,
  label,
  labelIcon,
}: {
  listing: ListingEvent;
  marketplacePackageId: string;
  marketplaceId: string;
  currentAddress?: string;
  label?: string;
  labelIcon?: ReactNode;
}) {
  const [status, setStatus] = useState<PurchaseStatus>({ state: "idle" });

  const priceInSui = Number(listing.price) / 1_000_000_000;
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  const suiClient = useSuiClient();

  const canBuy =
    Boolean(currentAddress) &&
    Boolean(marketplacePackageId) &&
    Boolean(marketplaceId) &&
    listing.paymentMethod === 0;

  const handleBuy = () => {
    if (!canBuy) return;
    const tx = new Transaction();
    const payment = tx.splitCoins(tx.gas, [tx.pure.u64(listing.price)]);
    tx.moveCall({
      target: `${marketplacePackageId}::marketplace::purchase_listing`,
      typeArguments: [SUI_TYPE],
      arguments: [
        tx.object(marketplaceId),
        tx.object(listing.listingId),
        payment,
      ],
    });
    setStatus({ state: "pending" });
    signAndExecute(
      { transaction: tx },
      {
        onSuccess: (result) => {
          suiClient
            .waitForTransaction({ digest: result.digest })
            .then(() => setStatus({ state: "success", digest: result.digest }))
            .catch((error) =>
              setStatus({
                state: "error",
                message:
                  error instanceof Error ? error.message : "Failed while waiting for on-chain confirmation",
              }),
            );
        },
        onError: (error) =>
          setStatus({
            state: "error",
            message: error instanceof Error ? error.message : String(error),
          }),
      },
    );
  };

  const title = listing.name ?? `Listing ${shorten(listing.listingId)}`;
  const listedAt = listing.timestampMs
    ? formatTimestamp(listing.timestampMs)
    : null;
  const priceLabel = priceInSui.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
  const explorerUrl =
    status.state === "success" ? getExplorerTxUrl(status.digest) : undefined;
  return (
    <ItemCard
      label={label ?? "Live Listing"}
      labelIcon={labelIcon}
      title={title}
      description={listing.description}
      listedAt={listedAt}
      seller={listing.seller}
      listingId={listing.listingId}
      walrusHash={listing.walrusHash}
      blobId={listing.blobId}
      encrypted={Boolean(listing.blobId || listing.walrusHash)}
      price={priceLabel}
      canBuy={canBuy}
      onBuy={handleBuy}
      status={status}
      explorerUrl={explorerUrl}
    />
  );
}

function shorten(value?: string, length = 8) {
  if (!value) return "";
  return `${value.slice(0, length)}...${value.slice(-length)}`;
}

function getExplorerTxUrl(digest: string) {
  return `https://suiexplorer.com/txblock/${digest}?network=testnet`;
}

function formatTimestamp(ms: number) {
  if (!ms) return "";
  const date = new Date(ms);
  return date.toLocaleString();
}
