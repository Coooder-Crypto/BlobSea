import type { Metadata } from "next";

import SellView from "@/components/SellView";

export const metadata: Metadata = {
  title: "BlobSea · 发送数据",
  description: "将 Walrus 加密上传与链上 Listing 创建放在同一工作台。",
};

export default function SellPage() {
  return <SellView />;
}
