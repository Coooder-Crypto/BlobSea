"use client";

import { useCurrentAccount } from "@mysten/dapp-kit";
import LicenseInventory from "@/components/LicenseInventory";

export default function InventoryView() {
  const currentAccount = useCurrentAccount();

  return (
    <section className="bg-[#050b15] h-[100vh] py-12 text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <LicenseInventory currentAddress={currentAccount?.address} />
      </div>
    </section>
  );
}
