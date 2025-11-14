import type { Metadata } from "next";
import "./globals.css";
import "@mysten/dapp-kit/dist/index.css";
import "@radix-ui/themes/styles.css";

import Providers from "@/components/Providers";
import HeaderNav from "@/components/HeaderNav";

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
          <main style={{ maxWidth: 1200, margin: "0 auto", padding: "1.5rem 1rem" }}>
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
