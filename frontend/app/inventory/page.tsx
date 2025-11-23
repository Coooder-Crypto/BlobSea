import type { Metadata } from "next";

import InventoryView from "@/components/InventoryView";

export const metadata: Metadata = {
  title: "BlobSea · Inventory",
  description: "Manage purchased licenses, decrypt Walrus blobs, and audit download history.",
};

export default function InventoryPage() {
  return <InventoryView />;
}
