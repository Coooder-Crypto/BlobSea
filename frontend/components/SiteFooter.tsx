'use client';

import Link from "next/link";

const footerLinks = [
  { label: "Docs", href: "https://github.com/mystenlabs/walrus" },
  { label: "Github", href: "https://github.com/coooder/BlobSea" },
  { label: "Walrus", href: "https://www.walrus.site/" },
  { label: "Sui", href: "https://sui.io" },
];

export default function SiteFooter() {
  return (
    <footer className="blobsea-footer">
      <div className="blobsea-footer__inner">
        <div className="blobsea-footer__brand">BLOBSEA</div>

        <div className="blobsea-footer__links">
          {footerLinks.map((link) => (
            <Link key={link.label} href={link.href} target="_blank" rel="noreferrer">
              {link.label}
            </Link>
          ))}
        </div>

        <div className="blobsea-footer__meta">&copy; 2024 BlobSea Marketplace</div>
      </div>
    </footer>
  );
}
