import MobileMenu from "@/src/components/common/Header/components/MobileMenu/MobileMenu";
import Logo from "@/src/components/common/Logo/Logo";
import {useLocalStorage} from "usehooks-ts";
import styles from "./Header.module.css";
import Link from "next/link";
import {clsx} from "clsx";
import {usePathname} from "next/navigation";
import ConnectButton from "@/src/components/common/ConnectButton/ConnectButton";
import LaunchAppButton from "@/src/components/common/LaunchAppButton/LaunchAppButton";
import DisconnectMobile from "@/src/components/common/ConnectButton/DisconnectMobile";
import {useIsConnected} from "@fuels/react";
import {
  BlogLink,
  FuelAppUrl,
  POINTS_LEARN_MORE_URL,
  POINTS_PROMO_TITLE,
} from "@/src/utils/constants";
import TestnetLabel from "@/src/components/common/TestnetLabel/TestnetLabel";
import IconButton from "../IconButton/IconButton";
import CloseIcon from "../../icons/Close/CloseIcon";
import {useEffect, useState} from "react";
import PointsIcon from "../../icons/Points/PointsIcon";

type Props = {
  isHomePage?: boolean;
};

const PROMO_BANNER_STORAGE_KEY = "fuel-boost-program-promo-banner-closed";

const ISSERVER = typeof window === "undefined";

const Header = ({isHomePage}: Props) => {
  const pathname = usePathname();
  const {isConnected} = useIsConnected();
  const [previousPage, setPreviousPage] = useLocalStorage<string | null>(
    "previousPage",
    null,
  );

  const [isPromoShown, setIsPromoShown] = useState(false);

  useEffect(() => {
    if (!ISSERVER) {
      const bannerClosed = localStorage.getItem(PROMO_BANNER_STORAGE_KEY);
      setIsPromoShown(!bannerClosed);
    }
  }, []);

  const handleCloseBanner = () => {
    setIsPromoShown(false);
    localStorage.setItem(PROMO_BANNER_STORAGE_KEY, "true");
  };

  const swapClick = () => {
    if (pathname === "/liquidity/") {
      setPreviousPage("liquidity");
    } else if (pathname === "/points/") {
      setPreviousPage("points");
    } else {
      setPreviousPage(null);
    }
  };

  const liquidityClick = () => {
    if (pathname === "/") {
      setPreviousPage("swap");
    } else if (pathname === "/points/") {
      setPreviousPage("points");
    } else {
      setPreviousPage(null);
    }
  };

  const pointsClick = () => {
    if (pathname === "/") {
      setPreviousPage("swap");
    } else if (pathname === "/liquidity/") {
      setPreviousPage("liquidity");
    } else {
      setPreviousPage(null);
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
          <IconButton onClick={handleCloseBanner} className={styles.promoClose}>
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
            <Link
              //TEMPORARY ROUTING SINCE LANDING PAGE IS DISABLED
              href="/"
              className={clsx(
                styles.link,
                pathname === "/" && styles.activeLink,
                (previousPage === "swap" || previousPage === null) &&
                  styles.staticFill,
                previousPage === "points" && styles.animateToLeft,
                previousPage === "liquidity" && styles.animateToLeft,
              )}
              onClick={swapClick}
            >
              Swap
            </Link>
            <Link
              onClick={liquidityClick}
              href="/liquidity"
              className={clsx(
                styles.link,
                pathname.includes("/liquidity") && styles.activeLink,
                previousPage === "swap" && styles.animateToRight,
                previousPage === "points" && styles.animateToLeft,
                (previousPage === "liquidity" || previousPage === null) &&
                  styles.staticFill,
              )}
            >
              Liquidity
            </Link>
            <Link
              onClick={pointsClick}
              href="/points"
              className={clsx(
                styles.link,
                pathname.includes("/points") && styles.activeLink,
                previousPage === "points"
                  ? styles.staticFill
                  : styles.animateToRight,
              )}
            >
              Points
            </Link>
            <a
              href={`${FuelAppUrl}/bridge?from=eth&to=fuel&auto_close=true&=true`}
              className={styles.link}
              target="_blank"
            >
              Bridge
            </a>
          </div>
        </div>

        <div className={clsx(styles.right)}>
          {isHomePage && (
            <>
              <a
                href="https://docs.mira.ly"
                className={styles.link}
                target="_blank"
              >
                Docs
              </a>
              <a href={BlogLink} className={styles.link} target="_blank">
                Blog
              </a>
            </>
          )}
          {/* {!isHomePage && <TestnetLabel />} */}
          {!isHomePage && <ConnectButton className={styles.launchAppButton} />}
          {isHomePage && (
            <div className={styles.launchAppArea}>
              {isConnected ? (
                <ConnectButton className={styles.launchAppButton} />
              ) : (
                <LaunchAppButton className={styles.launchAppButton} />
              )}
            </div>
          )}
        </div>

        <div className={clsx("mobileOnly", styles.links)}>
          <DisconnectMobile className={styles.disconnectMobile} />
          {/*   <MobileMenu /> */}
        </div>
      </section>

      <div className={clsx("mobileOnly", styles.navMobile)}>
        <div className={clsx("mc-type-b", styles.links)}>
          <Link
            href="/"
            className={clsx(
              styles.link,
              pathname === "/" && styles.activeLink,
              (previousPage === "swap" || previousPage === null) &&
                styles.staticFill,
              previousPage === "points" && styles.animateToLeft,
              previousPage === "liquidity" && styles.animateToLeft,
            )}
            onClick={swapClick}
          >
            Swap
          </Link>
          <Link
            href="/liquidity"
            className={clsx(
              styles.link,
              pathname.includes("/liquidity") && styles.activeLink,
              previousPage === "swap" && styles.animateToRight,
              previousPage === "points" && styles.animateToLeft,
              (previousPage === "liquidity" || previousPage === null) &&
                styles.staticFill,
            )}
            onClick={liquidityClick}
          >
            Liquidity
          </Link>
          <Link
            onClick={pointsClick}
            href="/points"
            className={clsx(
              styles.link,
              pathname.includes("/points") && styles.activeLink,
              previousPage === "points"
                ? styles.staticFill
                : styles.animateToRight,
            )}
          >
            Points
          </Link>
          <a
            href={`${FuelAppUrl}/bridge?from=eth&to=fuel&auto_close=true&=true`}
            className={styles.link}
            target="_blank"
          >
            Bridge
          </a>
        </div>
      </div>
    </header>
  );
};

export default Header;
