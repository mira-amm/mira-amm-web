"use client";

import Logo from "@/src/components/common/Logo/Logo";
import styles from "./Header.module.css";
import Link from "next/link";
import {clsx} from "clsx";
import {usePathname} from "next/navigation";
import ConnectButton from "@/src/components/common/ConnectButton/ConnectButton";
import {
  FuelAppUrl,
  POINTS_LEARN_MORE_URL,
  POINTS_PROMO_TITLE,
} from "@/src/utils/constants";
import IconButton from "../IconButton/IconButton";
import CloseIcon from "../../icons/Close/CloseIcon";
import {useEffect, useState, useRef, useLayoutEffect} from "react";
import PointsIcon from "../../icons/Points/PointsIcon";

const PROMO_BANNER_STORAGE_KEY = "fuel-boost-program-promo-banner-closed";

const ISSERVER = typeof window === "undefined";

const NavLinks = () => {
  const navRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLAnchorElement>(null);
  const pathname = usePathname();

  const [sliderStyle, setSliderStyle] = useState<{left: number; width: number}>(
    {left: 0, width: 0},
  );
  const [isReady, setIsReady] = useState(false);
  const [shouldAnimate, setShouldAnimate] = useState(false);

  const updateSliderPosition = (animate: boolean = false) => {
    if (!navRef.current || !activeRef.current) return;

    const activeRect = activeRef.current.getBoundingClientRect();
    const navRect = navRef.current.getBoundingClientRect();

    const left = activeRect.left - navRect.left;
    const width = activeRect.width;

    setSliderStyle({left, width});
    setShouldAnimate(animate && isReady && sliderStyle.width > 0);
  };

  useLayoutEffect(() => {
    updateSliderPosition(true);

    const handleResize = () => {
      updateSliderPosition(false);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [pathname]);

  useEffect(() => {
    setIsReady(true);
  }, []);

  return (
    <div className={styles.navLinksWrapper} ref={navRef}>
      <div
        className={clsx(styles.slider, shouldAnimate && styles.sliderAnimate)}
        style={{
          transform: `translateX(${sliderStyle.left}px)`,
          width: `${sliderStyle.width}px`,
        }}
      />
      <Link
        href="/"
        className={clsx(styles.link, pathname === "/" && styles.activeLink)}
        ref={pathname === "/" ? activeRef : null}
        aria-current={pathname === "/" ? "page" : undefined}
      >
        Swap
      </Link>
      <Link
        href="/liquidity"
        className={clsx(
          styles.link,
          pathname.startsWith("/liquidity") && styles.activeLink,
        )}
        ref={pathname.startsWith("/liquidity") ? activeRef : null}
        aria-current={pathname.startsWith("/liquidity") ? "page" : undefined}
      >
        Liquidity
      </Link>
      <Link
        href="/points"
        className={clsx(
          styles.link,
          pathname.startsWith("/points") && styles.activeLink,
        )}
        ref={pathname.startsWith("/points") ? activeRef : null}
        aria-current={pathname.startsWith("/points") ? "page" : undefined}
      >
        Points
      </Link>
      <a
        href={`${FuelAppUrl}/bridge?from=eth&to=fuel&auto_close=true&=true`}
        className={styles.link}
        target="_blank"
        rel="noopener noreferrer"
      >
        Bridge
      </a>
    </div>
  );
};

const Header = () => {
  const [isPromoShown, setIsPromoShown] = useState<boolean | null>(null);

  useEffect(() => {
    if (!ISSERVER) {
      try {
        const bannerClosed = localStorage.getItem(PROMO_BANNER_STORAGE_KEY);
        setIsPromoShown(!bannerClosed);
      } catch (error) {
        console.error("Error accessing localStorage:", error);
        setIsPromoShown(false);
      }
    }
  }, []);

  const handleCloseBanner = () => {
    try {
      setIsPromoShown(false);
      localStorage.setItem(PROMO_BANNER_STORAGE_KEY, "true");
    } catch (error) {
      console.error("Error setting localStorage:", error);
    }
  };

  return (
    <header className={styles.header}>
      {isPromoShown && (
        <section className={styles.promo}>
          <div className={styles.promo_text}>
            <PointsIcon />
            <p className="mc-type-l">
              {POINTS_PROMO_TITLE}
              <Link href={POINTS_LEARN_MORE_URL} target="_blank">
                <u>Learn More</u>
              </Link>
            </p>
          </div>
          <IconButton
            onClick={handleCloseBanner}
            className={styles.promoClose}
            aria-label="Close promo banner"
          >
            <CloseIcon />
          </IconButton>
        </section>
      )}
      <section className={styles.main}>
        <div className={styles.left}>
          <Logo />
        </div>

        <div className={clsx(styles.center)}>
          <div className={clsx("mc-type-l", styles.links)}>
            <NavLinks />
          </div>
        </div>

        <div className={clsx(styles.right)}>
          <ConnectButton className={styles.launchAppButton} />
        </div>

        <div className={clsx("mobileOnly", styles.links)}>
          <ConnectButton className={styles.disconnectMobile} />
        </div>
      </section>

      <div className={clsx("mobileOnly", styles.navMobile)}>
        <div className={clsx("mc-type-b", styles.links)}>
          <NavLinks />
        </div>
      </div>
    </header>
  );
};

export default Header;
