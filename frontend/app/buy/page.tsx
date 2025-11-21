import type { Metadata } from "next";

import BuyView from "@/components/BuyView";

export const metadata: Metadata = {
  title: "BlobSea · 购买数据",
  description: "浏览 Listing、完成支付并解密下载 Walrus 数据。",
};

export default function BuyPage() {
  return <BuyView />;
}
