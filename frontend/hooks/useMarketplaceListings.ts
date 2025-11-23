"use client";

import { useQuery } from "@tanstack/react-query";
import { useSuiClient } from "@mysten/dapp-kit";

import { useNetworkVariable } from "@/lib/networkConfig";
import { bytesFromSui, utf8FromBytes } from "@/lib/bytes";

export type ListingCategory = "dataset" | "model" | "image";

export type ListingEvent = {
  listingId: string;
  seller: string;
  price: bigint;
  coinType: string;
  paymentMethod: number;
  name?: string;
  description?: string;
  timestampMs?: number;
  blobId?: string;
  walrusHash?: string;
  category: ListingCategory;
};

export function useMarketplaceListings() {
  const suiClient = useSuiClient();
  const marketplacePackageId = useNetworkVariable("marketplacePackageId");
  const marketplaceId = useNetworkVariable("marketplaceId");

  const queryResult = useQuery<ListingEvent[]>({
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
          const name = rawName.length ? utf8FromBytes(rawName) : undefined;
          const description = rawDescription.length ? utf8FromBytes(rawDescription) : undefined;
          return {
            listingId: parsed.listing_id as string,
            seller: parsed.seller as string,
            price: BigInt(parsed.price ?? 0),
            coinType: parsed.coin_type?.fields?.name ?? "0x2::sui::SUI",
            paymentMethod: Number(parsed.payment_method ?? 0),
            name,
            description,
            timestampMs: event.timestampMs ? Number(event.timestampMs) : undefined,
            blobId: parsed.blob_id ?? undefined,
            walrusHash: parsed.walrus_hash ?? undefined,
            category: determineCategory(name, description),
          } satisfies ListingEvent;
        })
        .filter(Boolean) as ListingEvent[];
    },
    refetchInterval: 30_000,
  });

  return {
    ...queryResult,
    listings: queryResult.data ?? [],
    marketplacePackageId,
    marketplaceId,
  };
}

function determineCategory(name?: string, description?: string): ListingCategory {
  const text = `${name ?? ""} ${description ?? ""}`.toLowerCase();
  if (text.includes("model") || text.includes("weights") || text.includes("llm")) {
    return "model";
  }
  if (text.includes("image") || text.includes("vision") || text.includes("pixel")) {
    return "image";
  }
  return "dataset";
}
