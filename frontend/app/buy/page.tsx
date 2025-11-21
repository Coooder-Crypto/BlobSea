import type { Metadata } from "next";

import BuyView from "@/components/BuyView";

export const metadata: Metadata = {
  title: "BlobSea · Buy Data",
  description: "Browse listings, purchase, and decrypt Walrus-backed datasets.",
};

export default function BuyPage() {
  return <BuyView />;
}
