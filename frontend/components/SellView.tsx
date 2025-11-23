'use client';

import Link from "next/link";
import { useCurrentAccount } from "@mysten/dapp-kit";

import ListingCreator from "@/components/ListingCreator";

export default function SellView() {
  const currentAccount = useCurrentAccount();

  return (
    <section className="relative overflow-hidden bg-[#01030a] py-16 text-white">
      <div className="pointer-events-none absolute inset-0 bg-grid-pattern bg-[size:40px_40px] opacity-10" />
      <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <header className="mb-12 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-walrus-cyan/30 bg-walrus-cyan/10 px-5 py-2 font-mono text-xs uppercase tracking-[0.4em] text-walrus-cyan">
            Sell Data
          </div>
          <h1 className="mt-6 font-mono text-4xl font-bold leading-tight text-white">
            Encrypt, list, and get paid in one flow
          </h1>
          <p className="mx-auto mt-4 max-w-2xl font-mono text-sm text-white/70">
            BlobSea handles Walrus encryption and Sui listing commits for you. Upload once, define terms,
            and let agents discover your dataset automatically.
          </p>
          <div className="mt-6 inline-flex flex-wrap items-center justify-center gap-3 font-mono text-xs uppercase tracking-[0.3em] text-white/70">
            <Link
              href="/market"
              className="rounded-full border border-white/20 px-4 py-2 text-white transition hover:border-walrus-cyan/40 hover:text-white"
            >
              Browse active listings
            </Link>
            <span className="text-white/30">or</span>
            <Link
              href="/buy"
              className="rounded-full border border-white/20 px-4 py-2 text-white transition hover:border-walrus-cyan/40 hover:text-white"
            >
              Switch to buyer view
            </Link>
          </div>
        </header>

        {currentAccount ? (
          <ListingCreator currentAddress={currentAccount.address} />
        ) : (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-center shadow-[0_40px_80px_rgba(1,3,10,0.6)]">
            <h2 className="font-mono text-2xl text-white">Connect your Sui wallet</h2>
            <p className="mt-3 font-mono text-sm text-white/70">
              Use the top-right Connect Wallet button. Once authorized, BlobSea will encrypt files locally,
              upload them to Walrus, and mint listings on Sui for you.
            </p>
            <Link
              href="/"
              className="mt-6 inline-flex items-center justify-center rounded-full border border-walrus-cyan px-6 py-3 font-mono text-xs uppercase tracking-[0.3em] text-walrus-cyan transition hover:bg-walrus-cyan/10"
            >
              Back to homepage
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
