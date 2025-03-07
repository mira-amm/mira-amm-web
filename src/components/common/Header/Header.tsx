import MobileMenu from "@/src/components/common/Header/components/MobileMenu/MobileMenu";
import Logo from "@/src/components/common/Logo/Logo";

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
const Header = ({isHomePage}: Props): JSX.Element => {
  const pathname = usePathname();
  const {isConnected} = useIsConnected();

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

  return (
    <header className={styles.header}>
      {isPromoShown && (
        <section className={styles.promo}>
          <div className={styles.promo_text}>
            <PointsIcon />
            <p>
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

        <div className={styles.center}>
          <div className={clsx("desktopOnly", styles.links)}>
            <Link
              //TEMPORARY ROUTING SINCE LANDING PAGE IS DISABLED
              href="/"
              className={clsx(
                styles.link,
                pathname === "/" && styles.activeLink,
              )}
            >
              Swap
            </Link>
            <Link
              href="/liquidity"
              className={clsx(
                styles.link,
                pathname.includes("/liquidity") && styles.activeLink,
              )}
            >
              Liquidity
            </Link>
            <Link
              href="/points"
              className={clsx(
                styles.link,
                pathname.includes("/points") && styles.activeLink,
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

        <div className={clsx("desktopOnly", styles.right)}>
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
          {!isHomePage && <TestnetLabel />}
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
          <MobileMenu />
        </div>
      </section>
    </header>
  );
};

export default Header;
