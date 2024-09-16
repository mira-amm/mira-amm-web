import MobileMenu from "@/src/components/common/Header/components/MobileMenu/MobileMenu";
import Logo from "@/src/components/common/Logo/Logo";
import SoonLabel from "@/src/components/common/SoonLabel/SoonLabel";

import styles from './Header.module.css';
import Link from "next/link";
import {clsx} from "clsx";
import {usePathname} from "next/navigation";
import ConnectButton from "@/src/components/common/ConnectButton/ConnectButton";
import LaunchAppButton from "@/src/components/common/LaunchAppButton/LaunchAppButton";
import TestnetLabel from "@/src/components/common/TestnetLabel/TestnetLabel";
import DisconnectDesktop from "@/src/components/common/ConnectButton/DisconnectDesktop";
import DisconnectMobile from "@/src/components/common/ConnectButton/DisconnectMobile";
import {useIsConnected} from "@fuels/react";

type Props = {
  isHomePage?: boolean;
}

const Header = ({ isHomePage }: Props) => {
  const pathname = usePathname();
  const { isConnected } = useIsConnected();

  return (
    <header className={styles.header}>
      {isHomePage && (
        <section className={styles.promo}>
          Trade, Earn and get Rewards using the most efficient AMM on Fuel
          {/*<IconButton onClick={() => setPromoHidden(true)} className={styles.promoClose}>*/}
          {/*  <CloseIcon />*/}
          {/*</IconButton>*/}
        </section>
      )}
      <section className={styles.main}>
        <div className={styles.left}>
          <Logo/>
          <div className={clsx('desktopOnly', styles.links)}>
            <Link href="/swap" className={clsx(styles.link, pathname.includes('/swap') && styles.activeLink)}>
              Swap
            </Link>
            <Link href="/liquidity" className={clsx(styles.link, pathname.includes('/liquidity') && styles.activeLink)}>
              Liquidity
            </Link>
            <Link href="/faucet" className={clsx(styles.link, pathname.includes('/faucet') && styles.activeLink)}>
              Faucet
            </Link>
            <div className={styles.pointsText}>
              Points
              <SoonLabel className={styles.hiddenLabel}/>
            </div>
          </div>
        </div>
        <div className={clsx('mobileOnly', styles.links)}>
          <a className={styles.points}>
            <span className={styles.pointsText}>
              Points
            </span>
            <SoonLabel/>
          </a>
          <DisconnectMobile className={styles.disconnectMobile} />
          <MobileMenu />
        </div>
        <div className={clsx('desktopOnly', styles.links)}>
          {/*<a href="#" className={styles.link}>*/}
          {/*  Docs*/}
          {/*</a>*/}
          {!isHomePage && (
            <TestnetLabel />
          )}
          {!isHomePage && (
            <ConnectButton className={styles.launchAppButton} />
          )}
          {isHomePage && (
            <DisconnectDesktop className={styles.launchAppButton} />
          )}
          {isHomePage && !isConnected && (
            <LaunchAppButton className={styles.launchAppButton} />
          )}
        </div>
      </section>
    </header>
  );
}

export default Header;
