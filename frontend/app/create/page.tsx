import type { Metadata } from "next";

import SellView from "@/components/SellView";

export const metadata: Metadata = {
  title: "BlobSea · Sell Data",
  description: "Handle Walrus encryption and on-chain listing creation from one workspace.",
};

export default function SellPage() {
  return <SellView />;
}
