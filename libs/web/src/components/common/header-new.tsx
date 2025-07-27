"use client";

import {useEffect, useState, useCallback, useMemo} from "react";
import Link from "next/link";
import {usePathname} from "next/navigation";

import {Logo} from "@/src/components/common";
import {useIsConnected} from "@fuels/react";

import {
  FuelAppUrl,
  POINTS_LEARN_MORE_URL,
  POINTS_PROMO_TITLE,
} from "@/src/utils/constants";

import {IconButton} from "@/src/components/common";
import {PointsIcon} from "@/meshwave-ui/icons";
import {X} from "lucide-react";
import {cn} from "@/src/utils/cn";
import {ConnectWalletNew} from "./connect-wallet-new";

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
            <PointsIcon className="w-[18px] h-[18px]" />
            <p>
              {POINTS_PROMO_TITLE}
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

      <section className="flex justify-between items-center gap-4 px-4 pb-8 lg:pb-4 pt-4 lg:px-10">
        <div className="flex items-center gap-6 lg:gap-10 flex-1">
          <Logo />
        </div>

        <nav className="hidden lg:flex gap-6 items-center mx-auto">
          {navLinks.map(({href, label, match, external}) =>
            external ? (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1 rounded-full transition hover:bg-background-grey-light text-content-tertiary"
              >
                {label}
              </a>
            ) : (
              <Link
                key={label}
                href={href}
                className={cn(
                  "px-3 py-1 rounded-full transition hover:bg-background-grey-light text-content-tertiary",
                  match &&
                    "bg-background-primary text-white dark:bg-background-grey-light hover:bg-background-primary"
                )}
              >
                {label}
              </Link>
            )
          )}
        </nav>

        <div className="flex items-center flex-1 justify-end gap-2">
          <div className="hidden lg:flex">
            <ConnectWalletNew />
          </div>
        </div>
      </section>

      <div className="lg:hidden flex flex-col pb-4 gap-6">
        <nav className="flex gap-2 sm:gap-6 items-center mx-auto flex-wrap justify-center sm:pb-4">
          {navLinks.map(({href, label, match, external}) =>
            external ? (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1 rounded-full transition hover:bg-background-grey-light text-content-tertiary text-sm sm:text-base"
              >
                {label}
              </a>
            ) : (
              <Link
                key={label}
                href={href}
                className={cn(
                  "px-3 py-1 rounded-full transition hover:bg-background-grey-light text-content-tertiary text-sm sm:text-base",
                  match &&
                    "bg-background-primary text-white dark:bg-background-grey-light hover:bg-background-primary"
                )}
              >
                {label}
              </Link>
            )
          )}
        </nav>

        <div className="mx-auto">
          <ConnectWalletNew />
        </div>
      </div>
    </header>
  );
}
