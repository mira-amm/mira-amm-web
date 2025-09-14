"use client";

import {useMemo} from "react";
import {usePathname} from "next/navigation";
import {Logo} from "@/src/components/common";
import {FuelAppUrl} from "@/src/utils/constants";
import {ConnectWalletNew} from "./connect-wallet-new";
import {Navigation, type NavLink} from "./navigation";

export function HeaderNew({
  pathName,
}: {
  isHomePage?: boolean;
  pathName?: string;
}) {
  const pathname = pathName ?? usePathname();

  const navLinks = useMemo(
    () => [
      {href: "/", label: "Swap", match: pathname === "/"},
      {
        href: "/liquidity",
        label: "Liquidity",
        match: pathname.includes("/liquidity"),
      },
      {href: "/points", label: "Points", match: pathname.includes("/points")},
      {
        href: `${FuelAppUrl}/bridge?from=eth&to=fuel&auto_close=true&=true`,
        label: "Bridge",
        external: true,
      },
    ],
    [pathname]
  );

  return (
    <header
      className="md:sticky top-0 z-10 text-base lg:text-lg backdrop-blur-lg
        transition-all duration-300 ease-in-out"
    >
      <section className="flex flex-col py-7 gap-7 lg:pt-0 lg:flex-row justify-between items-center lg:gap-4 px-4 lg:py-4 lg:px-6">
        <div className="flex items-center gap-6 lg:gap-10 flex-1">
          <Logo />
        </div>

        <div className="flex">
          <Navigation
            navLinks={navLinks}
            size="small"
            className="gap-4 mx-auto"
          />
        </div>

        <div className="hidden sm:flex! items-center flex-1 justify-end gap-2">
          <ConnectWalletNew size="small" />
        </div>
        <div className="flex sm:hidden items-center flex-1 justify-end gap-2">
          <ConnectWalletNew size="large" />
        </div>
      </section>
    </header>
  );
}
