"use client";

import type { ReactNode } from "react";
import { Lock, ArrowRight, ExternalLink } from "lucide-react";
import { Button } from "./UI/Button";
import { Card } from "./UI/Card";

export type PurchaseStatus =
  | { state: "idle" }
  | { state: "pending" }
  | { state: "success"; digest: string }
  | { state: "error"; message: string };

type ItemCardProps = {
  label?: string;
  labelIcon?: ReactNode;
  title: string;
  description?: string;
  listedAt?: string | null;
  seller?: string;
  listingId?: string;
  walrusHash?: string;
  blobId?: string;
  encrypted?: boolean;
  price: string;
  priceUnit?: string;
  canBuy?: boolean;
  onBuy?: () => void;
  status: PurchaseStatus;
  explorerUrl?: string;
};

export default function ItemCard({
  label = "Live listing",
  labelIcon,
  title,
  description,
  listedAt,
  seller,
  listingId,
  walrusHash,
  blobId,
  encrypted,
  price,
  priceUnit = "SUI",
  canBuy,
  onBuy,
  status,
  explorerUrl,
}: ItemCardProps) {
  const disabled = !canBuy || status.state === "pending";

  const meta = [
    { label: "Seller", value: seller ? shorten(seller) : "Unknown" },
    { label: "Listing", value: listingId ? shorten(listingId) : "--" },
    { label: "Listed On", value: listedAt ?? "Unknown" },
  ];

  return (
    <Card
      hoverEffect
      className="flex flex-col h-full bg-zinc-900/50 backdrop-blur-sm"
    >
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2 text-walrus-cyan border border-walrus-cyan/20 bg-walrus-cyan/5 px-2 py-1 rounded text-xs font-mono uppercase">
          {labelIcon}
          <span>{label}</span>
        </div>
        {encrypted && (
          <div className="flex items-center gap-1 text-xs font-mono uppercase">
            <Lock className="w-3 h-3" /> Encrypted
          </div>
        )}
      </div>
      <div className="mb-5 space-y-3">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-white/40">
            {listedAt ?? "Recently listed"}
          </p>
          <h3 className="mt-2 font-mono text-2xl font-bold leading-tight text-white">
            {title}
          </h3>
        </div>
        {description && <p className="text-sm text-white/70">{description}</p>}
      </div>
      <div className="flex flex-col gap-4 mb-6 p-4 bg-black/30 rounded border border-white/5 font-mono text-xs">
        {meta.map(({ label: metaLabel, value }) => (
          <div className="flex gap-2" key={metaLabel}>
            <div className="mb-1 text-white/40">{metaLabel}:</div>
            <div className="text-white" title={value}>
              {value}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-auto flex items-center justify-between gap-4 pt-4 border-t border-white/10">
        <div className="font-pixel text-2xl text-walrus-purple">
          {price} <span className="text-sm font-mono text-gray-500">SUI</span>
        </div>
        <Button
          size="sm"
          className="flex-grow"
          onClick={onBuy}
          disabled={disabled}
        >
          Buy License
        </Button>
        {status.state === "success" && explorerUrl && (
          <a
            href={explorerUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.3em] text-walrus-green hover:text-walrus-cyan"
          >
            <ExternalLink className="h-4 w-4" /> View on chain
          </a>
        )}
        {status.state === "error" && (
          <p className="font-mono text-xs text-red-400">{status.message}</p>
        )}
      </div>
    </Card>
  );
}

function shorten(value?: string, length = 6) {
  if (!value) return "--";
  return `${value.slice(0, length)}...${value.slice(-length)}`;
}
