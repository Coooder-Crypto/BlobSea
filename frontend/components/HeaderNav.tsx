"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ConnectButton } from "@mysten/dapp-kit";
import BlobSeaLogo from "@/components/BlobSeaLogo";

const navLinks = [
  { label: "Discover", href: "/market" },
  { label: "Build", href: "/create" },
  { label: "Inventory", href: "/inventory" },
];

export default function HeaderNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setIsScrolled(window.scrollY > 100);
    handler();
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const isHome = pathname === "/";
  const showSolidBackground = !isHome || isScrolled;

  const handleLogoClick = () => {
    if (pathname !== "/") {
      router.push("/");
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const navItems = useMemo(
    () =>
      navLinks.map((link) => ({
        ...link,
        isActive: pathname === link.href,
      })),
    [pathname],
  );

  return (
    <nav
      className={`sticky top-0 z-50 w-full border-b transition-all duration-500 ${showSolidBackground ? "bg-[#040817]/90 backdrop-blur-md border-white/10 py-0 shadow-lg" : "bg-transparent border-transparent py-4"}`}
    >
      <div className="mx-auto flex h-14 items-center justify-between px-4 sm:px-6 lg:px-8">
        <div
          className={`
              flex items-center gap-3 cursor-pointer group transition-all duration-500 cubic-bezier(0.34, 1.56, 0.64, 1)
              ${
                showSolidBackground
                  ? "translate-y-0 scale-100 opacity-100 pointer-events-auto"
                  : "-translate-y-12 scale-50 opacity-0 pointer-events-none"
              }
            `}
          onClick={handleLogoClick}
        >
          <div className="relative transition-transform group-hover:-translate-y-1 duration-200">
            <div className="absolute inset-0 bg-walrus-cyan blur opacity-20 group-hover:opacity-40 transition-opacity"></div>
            <BlobSeaLogo className="w-12 h-12 relative z-10" />
          </div>
          <span className="font-pixel text-3xl font-bold text-white tracking-widest mt-1">
            BLOBSEA
          </span>
        </div>

        <div className="hidden items-center gap-8 font-mono text-sm uppercase tracking-wider text-white/60 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`pb-1 transition-colors ${item.isActive ? "border-b-2 border-[#53f7ff] text-white" : "border-b-2 border-transparent hover:text-white"}`}
            >
              {item.label}
            </Link>
          ))}
        </div>

        <div
          className={`transition-opacity duration-300 ${showSolidBackground ? "opacity-100" : "opacity-80"}`}
        >
          <ConnectButton />
        </div>
      </div>
    </nav>
  );
}
