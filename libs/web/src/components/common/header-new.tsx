"use client";

import {useEffect, useState, useCallback, useMemo} from "react";
import Link from "next/link";
import {usePathname} from "next/navigation";

import {Logo} from "@/src/components/common";
import {useIsConnected} from "@fuels/react";

import {
  FuelAppUrl,
  getPromoTitle,
  POINTS_LEARN_MORE_URL,
} from "@/src/utils/constants";

import {IconButton} from "@/src/components/common";
import {PointsIconSimple} from "@/meshwave-ui/icons";
import {X} from "lucide-react";
import {cn} from "@/src/utils/cn";
import {ConnectWalletNew} from "./connect-wallet-new";
import {Navigation, type NavLink} from "./navigation";

const PROMO_BANNER_STORAGE_KEY = "fuel-boost-program-promo-banner-closed";

export function HeaderNew({
  isHomePage,
  pathName,
}: {
  isHomePage?: boolean;
  pathName?: string;
}) {
  const pathname = pathName ?? usePathname();
  const {isConnected} = useIsConnected();
  const [isPromoShown, setIsPromoShown] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const bannerClosed = localStorage.getItem(PROMO_BANNER_STORAGE_KEY);
        setIsPromoShown(!bannerClosed);
      } catch (error) {
        console.warn("Failed to access localStorage:", error);
        setIsPromoShown(true);
      }
    }
  }, []);

  const handleCloseBanner = useCallback(() => {
    setIsPromoShown(false);
    try {
      localStorage.setItem(PROMO_BANNER_STORAGE_KEY, "true");
    } catch (error) {
      console.warn("Failed to save banner state:", error);
    }
  }, []);

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
      {isPromoShown && (
        <section className="relative flex items-center justify-between px-4 py-3 gap-4 text-white text-sm lg:text-lg lg:justify-center bg-old-mira-promo-bg">
          <div className="flex items-center gap-2 mx-auto">
            <PointsIconSimple className="w-[18px] h-[18px]" />
            <p>
              {getPromoTitle()}
              <Link
                href={POINTS_LEARN_MORE_URL}
                target="_blank"
                className="ml-1 underline"
              >
                Learn More
              </Link>
            </p>
          </div>
          <IconButton
            onClick={handleCloseBanner}
            className="absolute right-4 top-3"
          >
            <X />
          </IconButton>
        </section>
      )}

      <section className="flex justify-between items-center gap-4 px-4 py-4 lg:px-10">
        <div className="flex items-center gap-6 lg:gap-10 flex-1">
          <Logo />
        </div>

        <div className="hidden lg:flex">
          <Navigation
            navLinks={navLinks}
            size="small"
            className="gap-6 mx-auto"
          />
        </div>

        <div className="flex items-center flex-1 justify-end gap-2">
          <div className="hidden lg:flex">
            <ConnectWalletNew size="small" />
          </div>
        </div>
      </section>

      <div className="lg:hidden flex flex-col pb-4 gap-6">
        <div className="sm:pb-4">
          <Navigation
            navLinks={navLinks}
            size="small"
            className="flex gap-2 sm:gap-6 items-center mx-auto flex-wrap justify-center"
          />
        </div>

        <div className="mx-auto">
          <ConnectWalletNew size="small" />
        </div>
      </div>
    </header>
  );
}
