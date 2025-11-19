"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button, Card, Flex, Heading, Text, Separator } from "@radix-ui/themes";
import { useSignAndExecuteTransaction, useSuiClient } from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";

import { useNetworkVariable } from "@/lib/networkConfig";
import { bytesFromSui, utf8FromBytes } from "@/lib/bytes";

const SUI_TYPE = "0x2::sui::SUI";

type ListingEvent = {
  listingId: string;
  seller: string;
  price: bigint;
  coinType: string;
  paymentMethod: number;
  name?: string;
  description?: string;
  blobId?: string;
  walrusHash?: string;
};

type Props = {
  currentAddress?: string;
};

export default function ListingGallery({ currentAddress }: Props) {
  const suiClient = useSuiClient();
  const marketplacePackageId = useNetworkVariable("marketplacePackageId");
  const marketplaceId = useNetworkVariable("marketplaceId");

  const {
    data: listings,
    isLoading,
    error,
    refetch,
  } = useQuery<ListingEvent[]>({
    queryKey: ["blobsea-listings", marketplacePackageId],
    enabled: Boolean(marketplacePackageId),
    queryFn: async () => {
      if (!marketplacePackageId) return [];
      const eventType = `${marketplacePackageId}::marketplace::ListingCreated`;
      const events = await suiClient.queryEvents({
        query: { MoveEventType: eventType },
        order: "descending",
        limit: 20,
      });
      return events.data
        .map((event) => {
          const parsed = event.parsedJson as any;
          if (!parsed?.listing_id) return null;
          const rawName = bytesFromSui(parsed.name);
          const rawDescription = bytesFromSui(parsed.description);
          return {
            listingId: parsed.listing_id as string,
            seller: parsed.seller as string,
            price: BigInt(parsed.price ?? 0),
            coinType: parsed.coin_type?.fields?.name ?? SUI_TYPE,
            paymentMethod: Number(parsed.payment_method ?? 0),
            name: rawName.length ? utf8FromBytes(rawName) : undefined,
            description: rawDescription.length ? utf8FromBytes(rawDescription) : undefined,
            blobId: parsed.blob_id ?? undefined,
            walrusHash: parsed.walrus_hash ?? undefined,
          };
        })
        .filter(Boolean) as ListingEvent[];
    },
    refetchInterval: 30_000,
  });
  console.log(listings);

  const content = useMemo(() => {
    if (!marketplacePackageId || !marketplaceId) {
      return (
        <Text color="gray">
          请在环境变量中配置 `NEXT_PUBLIC_MARKETPLACE_PACKAGE_ID` 与
          `NEXT_PUBLIC_MARKETPLACE_ID`。
        </Text>
      );
    }

    if (isLoading) return <Text>加载中...</Text>;
    if (error)
      return (
        <Text color="red">
          加载失败：{error instanceof Error ? error.message : String(error)}
        </Text>
      );
    if (!listings || listings.length === 0) {
      return <Text color="gray">暂无 Listing，先上传并上架一个文件吧。</Text>;
    }

    return (
      <Flex direction="column" gap="3">
        {listings.map((listing) => (
          <ListingCard
            key={listing.listingId}
            listing={listing}
            marketplacePackageId={marketplacePackageId}
            marketplaceId={marketplaceId}
            currentAddress={currentAddress}
          />
        ))}
      </Flex>
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
          <Heading size="4">Listing 列表</Heading>
          <Button variant="soft" size="2" onClick={() => refetch()}>
            刷新
          </Button>
        </Flex>
        {content}
      </Flex>
    </Card>
  );
}

function ListingCard({
  listing,
  marketplacePackageId,
  marketplaceId,
  currentAddress,
}: {
  listing: ListingEvent;
  marketplacePackageId: string;
  marketplaceId: string;
  currentAddress?: string;
}) {
  const [status, setStatus] = useState<
    | { state: "idle" }
    | { state: "pending" }
    | { state: "success"; digest: string }
    | { state: "error"; message: string }
  >({ state: "idle" });

  const priceInSui = Number(listing.price) / 1_000_000_000;
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  const suiClient = useSuiClient();

  const canBuy =
    Boolean(currentAddress) &&
    marketplacePackageId &&
    marketplaceId &&
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
                  error instanceof Error ? error.message : "等待链上确认失败",
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
  return (
    <Card>
      <Flex direction="column" gap="2">
        <Heading size="3">{title}</Heading>
        {!listing.name && (
          <Text color="gray">ID：{shorten(listing.listingId)}</Text>
        )}
        <Text color="gray">卖家：{shorten(listing.seller)}</Text>
        {listing.description && (
          <Text color="gray">{listing.description}</Text>
        )}
        <Text>价格：{priceInSui} SUI</Text>
        {listing.blobId && (
          <Text color="gray">BlobId: {shorten(listing.blobId)}</Text>
        )}
        <Button
          onClick={handleBuy}
          disabled={!canBuy || status.state === "pending"}
        >
          {status.state === "pending"
            ? "购买中..."
            : canBuy
              ? "购买"
              : "连接钱包购买"}
        </Button>
        {status.state === "success" && (
          <Text color="green" size="2">
            <a
              href={getExplorerTxUrl(status.digest)}
              target="_blank"
              rel="noreferrer"
            >
              交易成功，查看区块链记录
            </a>
          </Text>
        )}
        {status.state === "error" && (
          <Text color="red" size="2">
            {status.message}
          </Text>
        )}
      </Flex>
    </Card>
  );
}

function shorten(value?: string, length = 8) {
  if (!value) return "";
  return `${value.slice(0, length)}...${value.slice(-length)}`;
}

function getExplorerTxUrl(digest: string) {
  return `https://suiexplorer.com/txblock/${digest}?network=testnet`;
}
