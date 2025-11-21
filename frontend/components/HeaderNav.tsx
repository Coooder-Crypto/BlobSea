'use client';

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@radix-ui/themes";
import { ConnectButton, useCurrentAccount } from "@mysten/dapp-kit";

const navLinks = [
  { label: "落地页", href: "/" },
  { label: "发送", href: "/sell" },
  { label: "购买", href: "/buy" },
];

export default function HeaderNav() {
  const currentAccount = useCurrentAccount();
  const pathname = usePathname();
  const router = useRouter();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setIsScrolled(window.scrollY > 80);
    handler();
    window.addEventListener("scroll", handler);
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
    <header className={`blobsea-header${showSolidBackground ? " is-active" : ""}`}>
      <div className="blobsea-header__inner">
        <button
          className={`blobsea-logo${showSolidBackground ? " is-visible" : ""}`}
          onClick={handleLogoClick}
        >
          <div className="blobsea-logo__glow" aria-hidden />
          <span className="blobsea-logo__mark">BLOBSEA</span>
        </button>

        <nav className="blobsea-nav">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`blobsea-nav__link${item.isActive ? " is-active" : ""}`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="blobsea-header__wallet">
          {currentAccount && (
            <Button
              variant="soft"
              size="2"
              onClick={() =>
                window.open(
                  `https://faucet.sui.io/?address=${currentAccount.address}`,
                  "_blank",
                )
              }
            >
              获取测试网 SUI
            </Button>
          )}
          <div className="blobsea-wallet__connect">
            <ConnectButton />
          </div>
        </div>
      </div>
    </header>
  );
}
