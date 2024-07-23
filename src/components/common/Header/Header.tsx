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

type Props = {
  isHomePage?: boolean;
}

const Header = ({ isHomePage }: Props) => {
  // const [promoHidden, setPromoHidden] = useState(false);
  const pathname = usePathname();

  return (
    <header className={styles.header}>
      <section className={styles.promo}>
        Trade, Earn and get Rewards using the Fuel most efficient AMM
        {/*<IconButton onClick={() => setPromoHidden(true)} className={styles.promoClose}>*/}
        {/*  <CloseIcon />*/}
        {/*</IconButton>*/}
      </section>
      <section className={styles.main}>
        <div className={styles.left}>
          <Logo/>
          <div className={clsx('desktopOnly', styles.links)}>
            <Link href="/swap" className={clsx(styles.link, pathname.includes('/swap') && styles.activeLink)}>
              Swap
            </Link>
            <div className={styles.linkAlike}>
              Liquidity
              <SoonLabel className={styles.hiddenLabel} />
            </div>
            <Link href="/faucet" className={clsx(styles.link, pathname.includes('/faucet') && styles.activeLink)}>
              Faucet
            </Link>
            <div className={styles.pointsText}>
              Points
              <SoonLabel className={styles.hiddenLabel} />
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
          <MobileMenu/>
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
            <LaunchAppButton className={styles.launchAppButton} />
          )}
        </div>
      </section>
    </header>
  );
}

export default Header;
