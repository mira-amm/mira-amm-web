'use client';

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";

import Logo from "@/src/components/common/Logo/Logo";
import MobileMenu from "@/src/components/common/Header/components/MobileMenu/MobileMenu";
import ConnectButton from "@/src/components/common/ConnectButton/ConnectButton";
import LaunchAppButton from "@/src/components/common/LaunchAppButton/LaunchAppButton";
import DisconnectMobile from "@/src/components/common/ConnectButton/DisconnectMobile";
import { useIsConnected } from "@fuels/react";

import {
  BlogLink,
  FuelAppUrl,
  POINTS_LEARN_MORE_URL,
  POINTS_PROMO_TITLE,
} from "@/src/utils/constants";

import TestnetLabel from "@/src/components/common/TestnetLabel/TestnetLabel";
import IconButton from "../IconButton/IconButton";
import CloseIcon from "../../icons/Close/CloseIcon";
import PointsIcon from "../../icons/Points/PointsIcon";

type Props = {
  isHomePage?: boolean;
};

const PROMO_BANNER_STORAGE_KEY = "fuel-boost-program-promo-banner-closed";

export default function Header({ isHomePage }: Props) {
  const pathname = usePathname();
  const { isConnected } = useIsConnected();
  const [isPromoShown, setIsPromoShown] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const bannerClosed = localStorage.getItem(PROMO_BANNER_STORAGE_KEY);
      setIsPromoShown(!bannerClosed);
    }
  }, []);

  const handleCloseBanner = useCallback(() => {
    setIsPromoShown(false);
    localStorage.setItem(PROMO_BANNER_STORAGE_KEY, "true");
  }, []);

  const navLinks = useMemo(() => [
    { href: "/", label: "Swap", match: pathname === "/" },
    { href: "/liquidity", label: "Liquidity", match: pathname.includes("/liquidity") },
    { href: "/points", label: "Points", match: pathname.includes("/points") },
    { href: `${FuelAppUrl}/bridge?from=eth&to=fuel&auto_close=true&=true`, label: "Bridge", external: true },
  ], [pathname]);

  return (
    <header className="sticky top-0 z-10 text-base lg:text-lg">
      {isPromoShown && (
        <section className="relative flex items-center justify-between px-4 py-3 bg-[#507ff7] text-white text-sm lg:text-lg lg:justify-center">
          <div className="flex items-center gap-2">
            <PointsIcon className="w-[18px] h-[18px]" />
            <p>
              {POINTS_PROMO_TITLE}
              <Link href={POINTS_LEARN_MORE_URL} target="_blank" className="ml-1 underline">
                Learn More
              </Link>
            </p>
          </div>
          <IconButton onClick={handleCloseBanner} className="absolute right-4 top-3">
            <CloseIcon />
          </IconButton>
        </section>
      )}

      <section className="flex justify-between items-center gap-4 px-4 py-4 bg-[var(--background-primary)] lg:px-10">
        <div className="flex items-center gap-6 lg:gap-10">
          <Logo />
          <nav className="hidden lg:flex gap-6 items-center">
            {navLinks.map(({ href, label, match, external }) =>
              external ? (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1 rounded-full transition hover:bg-[var(--background-grey-light)]"
                >
                  {label}
                </a>
              ) : (
                <Link
                  key={label}
                  href={href}
                  className={clsx(
                    "px-3 py-1 rounded-full transition hover:bg-[var(--background-grey-light)]",
                    match && "bg-[var(--background-grey-light)]"
                  )}
                >
                  {label}
                </Link>
              )
            )}
          </nav>
        </div>

        <div className="flex lg:hidden items-center gap-3">
          <DisconnectMobile className="gap-1 px-2 py-1 text-sm font-medium leading-4" />
          <MobileMenu />
        </div>

        <div className="hidden lg:flex items-center gap-6">
          {isHomePage ? (
            <>
              <a href="https://docs.mira.ly" target="_blank" className="hover:text-[var(--content-dimmed-light)] transition">
                Docs
              </a>
              <a href={BlogLink} target="_blank" className="hover:text-[var(--content-dimmed-light)] transition">
                Blog
              </a>
            </>
          ) : (
            <TestnetLabel />
          )}

          {isHomePage ? (
            <div className="flex items-center gap-6">
              {isConnected ? (
                <ConnectButton className="min-w-[158px] h-10 text-base leading-6" />
              ) : (
                <LaunchAppButton className="min-w-[158px] h-10 text-base leading-6" />
              )}
            </div>
          ) : (
            <ConnectButton className="min-w-[158px] h-10 text-base leading-6" />
          )}
        </div>
      </section>
    </header>
  );
}
