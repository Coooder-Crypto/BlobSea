import type { Metadata } from "next";
import "./globals.css";
import "@mysten/dapp-kit/dist/index.css";
import "@radix-ui/themes/styles.css";

import Providers from "@/components/Providers";
import HeaderNav from "@/components/HeaderNav";
import SiteFooter from "@/components/SiteFooter";

export const metadata: Metadata = {
  title: "BlobSea",
  description: "Minimal Walrus-powered data marketplace on Sui",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <HeaderNav />
          <main className="min-h-screen">{children}</main>
          <SiteFooter />
        </Providers>
      </body>
    </html>
  );
}
