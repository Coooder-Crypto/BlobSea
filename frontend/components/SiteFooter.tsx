"use client";

const footerLinks = [
  { label: "Docs", href: "https://coooder.gitbook.io/blobsea/" },
  { label: "Github", href: "https://github.com/Coooder-Crypto/BlobSea" },
  { label: "Walrus", href: "https://www.walrus.site/" },
  { label: "Sui", href: "https://sui.io" },
];

export default function SiteFooter() {
  return (
    <footer className="border-t border-white/10 bg-[#02030a] text-white/70">
      <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-10 text-center md:flex-row md:items-center md:justify-between md:text-left">
        <div className="font-pixel text-lg tracking-[0.5em] text-white">
          BLOBSEA
        </div>
        <div className="flex flex-wrap items-center justify-center gap-4 text-[0.65rem] uppercase tracking-[0.4em] md:justify-start">
          {footerLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              target="_blank"
              rel="noreferrer"
              className="text-white/60 transition-colors hover:text-white"
            >
              {link.label}
            </a>
          ))}
        </div>
        <div className="text-[0.6rem] uppercase tracking-[0.4em] text-white/50">
          © 2025 BlobSea Marketplace
        </div>
      </div>
    </footer>
  );
}
