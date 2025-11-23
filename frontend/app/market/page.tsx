"use client";

import { useMemo, useState, type ReactNode } from "react";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { FileText, Box, Image as ImageIcon } from "lucide-react";

import { ListingCard } from "@/components/ListingGallery";
import {
  useMarketplaceListings,
  type ListingCategory,
} from "@/hooks/useMarketplaceListings";

type FilterKey = "all" | ListingCategory;

const CATEGORY_META: Record<
  ListingCategory,
  { label: string; icon: typeof FileText }
> = {
  dataset: { label: "Datasets", icon: FileText },
  model: { label: "Models", icon: Box },
  image: { label: "Images", icon: ImageIcon },
};

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "dataset", label: "Datasets" },
  { key: "model", label: "Models" },
  { key: "image", label: "Images" },
];

export default function MarketPage() {
  const [filter, setFilter] = useState<FilterKey>("all");
  const currentAccount = useCurrentAccount();
  const {
    listings,
    isLoading,
    error,
    marketplaceId,
    marketplacePackageId,
    refetch,
  } = useMarketplaceListings();

  const filteredListings = useMemo(() => {
    if (filter === "all") return listings;
    return listings.filter((listing) => listing.category === filter);
  }, [listings, filter]);

  let gridContent: ReactNode = null;
  if (!marketplacePackageId || !marketplaceId) {
    gridContent = (
      <p className="text-center font-mono text-sm text-white/60">
        Configure `NEXT_PUBLIC_MARKETPLACE_PACKAGE_ID` and
        `NEXT_PUBLIC_MARKETPLACE_ID` to fetch listings.
      </p>
    );
  } else if (isLoading) {
    gridContent = (
      <p className="text-center font-mono text-sm text-white/60">
        Loading marketplace…
      </p>
    );
  } else if (error) {
    gridContent = (
      <p className="text-center font-mono text-sm text-red-400">
        Failed to load listings:{" "}
        {error instanceof Error ? error.message : String(error)}
      </p>
    );
  } else if (filteredListings.length === 0) {
    gridContent = (
      <p className="text-center font-mono text-sm text-white/60">
        No listings match this filter yet. Upload data from the Sell workspace
        first.
      </p>
    );
  } else {
    gridContent = (
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
        {filteredListings.map((listing) => {
          const meta = CATEGORY_META[listing.category] ?? CATEGORY_META.dataset;
          const Icon = meta.icon;
          return (
            <ListingCard
              key={listing.listingId}
              listing={listing}
              marketplaceId={marketplaceId}
              marketplacePackageId={marketplacePackageId}
              currentAddress={currentAccount?.address}
              label={`${meta.label}`.toUpperCase()}
              labelIcon={<Icon className="h-4 w-4" />}
            />
          );
        })}
      </div>
    );
  }

  return (
    <section className="bg-[#01030a] py-12 text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12">
          <h2 className="font-pixel text-5xl mb-4 text-white">DISCOVER DATA</h2>
          <p className="font-mono text-gray-400">
            Explore verified datasets stored on Walrus.
          </p>
        </div>

        <div className="mb-12 flex flex-wrap gap-4 border-b border-white/10 pb-6">
          {FILTERS.map((option) => (
            <button
              key={option.key}
              type="button"
              onClick={() => setFilter(option.key)}
              className={`font-mono uppercase text-sm px-4 py-2 border transition duration-200 ${
                filter === option.key
                  ? "bg-white text-black border-white"
                  : "border-gray-700 text-gray-500 hover:border-white hover:text-white"
              }`}
            >
              {option.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => refetch()}
            className="ml-auto rounded-full border border-white/20 px-4 py-2 font-mono text-xs uppercase tracking-[0.3em] text-white/70 transition hover:border-walrus-cyan/50 hover:text-white"
          >
            Refresh
          </button>
        </div>

        {gridContent}
      </div>
    </section>
  );
}
