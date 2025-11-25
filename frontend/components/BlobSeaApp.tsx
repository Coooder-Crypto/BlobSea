"use client";

import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Database,
  ShieldCheck,
  Zap,
  Terminal,
  Code,
  Cpu,
} from "lucide-react";

import BlobSeaLogo from "@/components/BlobSeaLogo";

type SectionKey = "features" | "sdk";

const featureCards = [
  {
    icon: ShieldCheck,
    title: "End-to-End Encryption",
    description:
      "Your data is encrypted client-side before it ever touches Walrus.",
  },
  {
    icon: Database,
    title: "Provable Ownership",
    description:
      "Listing metadata and licenses are minted on Sui for transparent history.",
  },
  {
    icon: Zap,
    title: "Agent Ready",
    description:
      "Structured metadata allows agents to autonomously discover and buy data.",
  },
];

const sdkHighlights = [
  { icon: Code, label: "Type-safe TypeScript SDK" },
  { icon: Cpu, label: "HTTP 402 automation" },
];

const codeSnippet = `import { BlobSeaAgent } from '@blobsea/sdk';

// 1. Bootstrap the agent
const agent = new BlobSeaAgent({
  suiNetwork: 'testnet',
  keypair: process.env.AGENT_KEY,
});

// 2. Discover & Purchase Data
const listingId = '0x123...abc';
const license = await agent.marketplace.buy({
  listing: listingId,
  budget: '100 SUI',
});

// 3. Download & Decrypt (Auto-handled)
const dataset = await license.download();
console.log(dataset.files[0].name);
// → 'training_data_v1.jsonl'`;

export default function BlobSeaApp() {
  const [scrollY, setScrollY] = useState(0);
  const [visible, setVisible] = useState<Record<SectionKey, boolean>>({
    features: false,
    sdk: false,
  });
  const featuresRef = useRef<HTMLDivElement | null>(null);
  const sdkRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handler = () => setScrollY(window.scrollY);
    handler();
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const key = entry.target.getAttribute("data-section");
          if (entry.isIntersecting && (key === "features" || key === "sdk")) {
            setVisible((prev) => (prev[key] ? prev : { ...prev, [key]: true }));
          }
        });
      },
      { threshold: 0.15 },
    );

    const sections: Array<[SectionKey, RefObject<HTMLDivElement>]> = [
      ["features", featuresRef],
      ["sdk", sdkRef],
    ];

    sections.forEach(([key, ref]) => {
      if (ref.current) {
        ref.current.setAttribute("data-section", key);
        observer.observe(ref.current);
      }
    });

    return () => observer.disconnect();
  }, []);

  const heroLogoStyle = useMemo(() => {
    const translate = Math.min(scrollY * 0.3, 180);
    const scale = Math.max(0.8, 1 - scrollY * 0.001);
    const rotate = scrollY * 0.02;
    const opacity = Math.max(0, 1 - scrollY / 400);
    return {
      transform: `translateY(${translate}px) scale(${scale}) rotate(${rotate}deg)`,
      opacity,
      filter: `blur(${Math.min(10, scrollY * 0.02)}px)`,
    };
  }, [scrollY]);

  return (
    <div className="relative overflow-hidden bg-[#01030a] py-20 text-white">
      <div
        className="absolute inset-0 bg-grid-pattern bg-[size:40px_40px] opacity-10"
        style={{ transform: `translateY(${scrollY * 0.2}px)` }}
      />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <section className="text-center">
          <div
            className="mb-4 flex justify-center will-change-transform"
            style={heroLogoStyle}
          >
            <div className="relative group ">
              <div className="absolute inset-0 bg-[#53f7ff] blur-2xl opacity-15 group-hover:opacity-30 transition-opacity" />
              <div className="relative animate-float drop-shadow-[0_0_12px_rgba(34,211,238,0.45)]">
                <BlobSeaLogo className="h-36 w-36 md:h-48 md:w-48" />
              </div>
            </div>
          </div>

          <div className="inline-block mb-4 px-4 py-2 border border-walrus-cyan/30 bg-walrus-cyan/5 rounded-full transition-all duration-500">
            <span className="font-mono text-xs text-walrus-cyan uppercase tracking-widest">
              Built on Walrus & Sui
            </span>
          </div>

          <h1
            className="font-mono text-3xl md:text-5xl font-bold leading-tight mb-8 text-white transition-transform duration-75 ease-out relative z-20"
            style={{ transform: `translateY(${scrollY * 0.2}px)` }}
          >
            ENABLING DATA MARKETS
            <br />
            {/* Enhanced Pixel Style for the second line */}
            <span className="block mt-2 font-pixel text-4xl md:text-7xl text-transparent bg-clip-text bg-gradient-to-r from-walrus-cyan via-white to-walrus-purple drop-shadow-[4px_4px_0_rgba(34,211,238,0.25)]">
              FOR THE AI ERA
            </span>
          </h1>

          <div className="relative z-20 max-w-4xl mx-auto -mt-2 sm:-mt-4 mb-4 py-6 bg-walrus-dark/40 backdrop-blur-md border border-white/10 rounded-xl shadow-2xl transition-all duration-300 hover:border-walrus-cyan/30 hover:bg-walrus-dark/60 group">
            {/* Decorative corners */}
            <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-walrus-cyan/50 rounded-tl-lg"></div>
            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-walrus-purple/50 rounded-br-lg"></div>

            <p className="font-bold text-lg text-gray-300 font-mono">
              BlobSea is where the world’s data becomes{" "}
              <span className="text-walrus-cyan font-bold">reliable</span>,{" "}
              <span className="text-walrus-purple font-bold">valuable</span>,
              and{" "}
              <span className="text-walrus-green font-bold">governable</span>.
              <br className="hidden md:block" />
              Securely trade{" "}
              <span className="text-white">encrypted datasets</span> and models
              with{" "}
              <span className="border-b-2 border-walrus-cyan/30 pb-0.5">
                on-chain verification
              </span>
              .
            </p>
          </div>

          <div className="mt-2 flex flex-col items-center justify-center gap-6 sm:flex-row">
            <Link
              href="/market"
              className="font-bold inline-flex items-center gap-2 border-2 border-[#53f7ff] bg-[#53f7ff] px-8 py-4 font-mono text-sm uppercase tracking-wider text-black shadow-[4px_4px_0_rgba(34,211,238,0.3)] transition-transform duration-200 hover:-translate-y-1 hover:shadow-[6px_6px_0_rgba(34,211,238,0.5)]"
            >
              Start Exploring <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              href="https://coooder.gitbook.io/blobsea/"
              target="_blank"
              rel="noreferrer"
              className="font-bold inline-flex items-center gap-2 border-2 border-[#53f7ff] px-8 py-4 font-mono text-sm uppercase tracking-wider text-white transition-transform duration-200 hover:-translate-y-1 hover:bg-[#53f7ff]/10"
            >
              Read Documentation
            </Link>
          </div>
        </section>

        <section
          ref={featuresRef}
          className={`mt-24 grid gap-8 md:grid-cols-2 lg:grid-cols-3 ${visible.features ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"} transition-all duration-700`}
        >
          {featureCards.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="rounded-[28px] border border-white/10 bg-[#0b1326]/80 p-8 text-left shadow-[0_20px_40px_rgba(0,0,0,0.45)] transition-transform duration-300 hover:-translate-y-2 hover:border-[#53f7ff66]"
            >
              <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-white/15 bg-white/10">
                <Icon className="h-6 w-6" />
              </div>
              <h3 className="font-mono text-xl font-bold">{title}</h3>
              <p className="text-sm text-gray-300">{description}</p>
            </div>
          ))}
        </section>

        <section
          ref={sdkRef}
          className={`mt-24 overflow-hidden border border-white/15 bg-[#04060f]/80 transition-all duration-700 ${visible.sdk ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"}`}
        >
          <div className="grid gap-0 md:grid-cols-2">
            <div className="flex flex-col justify-center border-b border-white/15 px-10 py-12 font-mono text-white transition-colors duration-300 hover:bg-white/5 md:border-b-0 md:border-r">
              <div className="mb-6 flex items-center gap-3">
                <Terminal className="h-6 w-6 text-walrus-purple" />
                <span className="font-pixel text-2xl tracking-[0.3em]">
                  SDK &amp; AGENT API
                </span>
              </div>
              <h2 className="text-3xl font-bold">Programmable Data Markets</h2>
              <p className="mt-4 text-sm text-white/70">
                Integrate BlobSea directly into your AI pipelines. Our SDK
                handles listing discovery, on-chain payments, and decryption
                automatically—perfect for autonomous agents.
              </p>
              <div className="mt-8 space-y-4">
                {sdkHighlights.map(({ icon: Icon, label }, index) => (
                  <div
                    key={label}
                    className="flex items-center gap-4 text-sm text-white/80"
                  >
                    <span
                      className={`flex h-10 w-10 items-center justify-center border ${
                        index === 0
                          ? "border-walrus-cyan/40 bg-walrus-cyan/10"
                          : "border-walrus-purple/40 bg-walrus-purple/10"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <span>{label}</span>
                  </div>
                ))}
              </div>
              <div className="mt-10">
                <Link
                  href="https://coooder.gitbook.io/blobsea/docs/sdk-cli"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-3 border-2 border-walrus-cyan px-5 py-3 text-xs uppercase tracking-[0.3em] text-walrus-cyan transition hover:bg-walrus-cyan/10"
                >
                  View Developer Docs <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
            <div className="bg-[#0d0d10] px-8 py-10 font-mono text-xs text-white/80 md:px-12">
              <div className="mb-4 flex gap-2">
                <span className="h-3 w-3 rounded-full bg-red-500/40" />
                <span className="h-3 w-3 rounded-full bg-yellow-500/40" />
                <span className="h-3 w-3 rounded-full bg-green-500/40" />
              </div>
              <pre className="text-white/80">{codeSnippet}</pre>
              <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4">
                <span className="font-pixel text-3xl font-bold text-white">
                  npm install @blobsea/sdk
                </span>
                <span className="font-pixel text-xl font-bold uppercase tracking-[0.3em] text-walrus-green">
                  v0.1.0-beta
                </span>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-16 text-center font-pixel text-xs uppercase tracking-[0.5em] text-white/50">
          <div className="flex flex-wrap items-center justify-center gap-4">
            <span>///</span>
            <span>HTTP 402</span>
            <span>///</span>
            <span>PAYMENT REQUIRED</span>
            <span>///</span>
            <span>AUTOMATION</span>
            <span>///</span>
          </div>
        </section>
      </div>
    </div>
  );
}
