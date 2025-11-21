'use client';

import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import Link from "next/link";
import {
  CubeIcon,
  LightningBoltIcon,
  LockClosedIcon,
  CodeIcon,
  RocketIcon,
} from "@radix-ui/react-icons";

import BlobSeaLogo from "@/components/BlobSeaLogo";

type SectionKey = "features" | "sdk";

const features = [
  {
    title: "End-to-end encryption",
    description:
      "Files are encrypted client-side with AES-GCM and tracked with a Walrus hash so only licensed buyers can decrypt them.",
    Icon: LockClosedIcon,
  },
  {
    title: "Provable ownership",
    description:
      "Listings and licenses mint on Sui, giving you tamper-evident purchase history and audit trails.",
    Icon: CubeIcon,
  },
  {
    title: "Agent-ready",
    description:
      "Structured metadata and the SDK make it easy for autonomous agents to discover, settle, and download datasets.",
    Icon: LightningBoltIcon,
  },
];

const developerBullets = [
  { Icon: CodeIcon, text: "TypeScript SDK (in progress)" },
  { Icon: RocketIcon, text: "HTTP 402 / agent payment flows" },
];

const codeSnippet = `// 1. Initialize a BlobSea agent
import { BlobSeaAgent } from '@blobsea/sdk';

const agent = new BlobSeaAgent({
  network: 'sui:testnet',
  key: process.env.AGENT_KEY,
});

// 2. Discover and purchase a listing
const license = await agent.marketplace.buy({
  listing: '0x123...abc',
  budget: '100 SUI',
});

// 3. Auto-download and decrypt
const dataset = await license.download();
console.log(dataset.files[0].name);`;

export default function BlobSeaApp() {
  const [scrollY, setScrollY] = useState(0);
  const [revealed, setRevealed] = useState<Record<SectionKey, boolean>>({
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
            setRevealed((prev) =>
              prev[key] ? prev : { ...prev, [key]: true },
            );
          }
        });
      },
      { threshold: 0.25 },
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
      filter: `blur(${Math.min(8, scrollY * 0.02)}px)`,
    };
  }, [scrollY]);

  const heroTaglineStyle = useMemo(
    () => ({
      transform: `translateY(${scrollY * 0.25}px)`,
      opacity: Math.max(0, 1 - scrollY / 550),
    }),
    [scrollY],
  );

  const heroCardStyle = useMemo(
    () => ({ transform: `translateY(${scrollY * 0.15}px)` }),
    [scrollY],
  );

  return (
    <div className="blobsea-landing">
      <div className="blobsea-hero">
        <div className="blobsea-hero__grid" style={{ transform: `translateY(${scrollY * 0.2}px)` }} />
        <div className="blobsea-hero__aura" style={{ transform: `translate(-50%, ${scrollY * 0.5}px)` }} />
        <div className="blobsea-hero__halo blobsea-hero__halo--left" />
        <div className="blobsea-hero__halo blobsea-hero__halo--right" />

        <div className="blobsea-hero__inner">
          <div className="blobsea-hero__logo" style={heroLogoStyle}>
            <div className="blobsea-hero__logo-glow" />
            <div className="blobsea-hero__logo-float">
              <BlobSeaLogo />
            </div>
          </div>

          <div className="blobsea-pill" style={heroTaglineStyle}>
            BUILT ON WALRUS &amp; SUI
          </div>

          <h1 className="blobsea-headline" style={{ transform: `translateY(${scrollY * 0.2}px)` }}>
            ENABLING DATA MARKETS
            <span className="blobsea-headline__pixel">FOR THE AI ERA</span>
          </h1>

          <div className="blobsea-hero__card" style={heroCardStyle}>
            <p>
              BlobSea unifies Walrus encryption, Sui listings, and license-based decryption
              into one agent-ready workflow. Creators publish in a single step, while buyers
              and agents can purchase, verify, and download original datasets automatically.
            </p>
            <div className="blobsea-hero__cta">
              <Link href="/sell" className="blobsea-btn blobsea-btn--primary">
                Sell data
              </Link>
              <Link href="/buy" className="blobsea-btn blobsea-btn--outline">
                Browse listings
              </Link>
              <Link href="https://github.com/coooder/BlobSea" target="_blank" rel="noreferrer" className="blobsea-link">
                Project docs
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div
        ref={featuresRef}
        className={`blobsea-feature-grid${revealed.features ? " is-visible" : ""}`}
      >
        {features.map(({ title, description, Icon }) => (
          <div key={title} className="blobsea-feature-card">
            <div className="blobsea-feature-icon">
              <Icon width={22} height={22} />
            </div>
            <h3>{title}</h3>
            <p>{description}</p>
          </div>
        ))}
      </div>

      <div
        ref={sdkRef}
        className={`blobsea-sdk${revealed.sdk ? " is-visible" : ""}`}
      >
        <div className="blobsea-sdk__content">
          <div className="blobsea-sdk__label">SDK &amp; AGENT API</div>
          <h2>Programmable Data Markets</h2>
          <p>
            Plug BlobSea directly into AI pipelines via an SDK that handles listing discovery,
            on-chain payment, and license decryption—perfect for responding to HTTP 402
            workflows automatically.
          </p>
          <ul>
            {developerBullets.map(({ Icon, text }) => (
              <li key={text}>
                <span className="blobsea-sdk__bullet">
                  <Icon width={16} height={16} />
                </span>
                {text}
              </li>
            ))}
          </ul>
          <Link
            href="https://github.com/coooder/BlobSea"
            target="_blank"
            rel="noreferrer"
            className="blobsea-btn blobsea-btn--secondary"
          >
            View developer docs
          </Link>
        </div>
        <div className="blobsea-code">
          <div className="blobsea-code__traffic">
            <span />
            <span />
            <span />
          </div>
          <pre>{codeSnippet}</pre>
          <div className="blobsea-code__footer">
            <span>npm install @blobsea/sdk</span>
            <span>v0.1.0-beta</span>
          </div>
        </div>
      </div>

      <div className="blobsea-banner">
        <span>///</span>
        <span>HTTP 402</span>
        <span>///</span>
        <span>PAYMENT REQUIRED</span>
        <span>///</span>
        <span>AUTOMATION</span>
        <span>///</span>
      </div>
    </div>
  );
}
