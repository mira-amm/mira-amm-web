import MobileMenu from "@/src/components/common/Header/components/MobileMenu/MobileMenu";
import Logo from "@/src/components/common/Logo/Logo";
import SoonLabel from "@/src/components/common/SoonLabel/SoonLabel";

import styles from './Header.module.css';
import Link from "next/link";
import {clsx} from "clsx";
import ActionButton from "@/src/components/common/ActionButton/ActionButton";
import {usePathname} from "next/navigation";

const Header = () => {
  const pathname = usePathname();
  console.log(pathname)

  return (
    <header className={styles.header}>
      <section className={styles.promo}>
        Trade, Earn and get Rewards using the Fuel most efficient AMM
      </section>
      <section className={styles.main}>
        <div className={styles.left}>
          <Logo/>
          <div className={clsx('desktopOnly', styles.links)}>
            <Link href="/swap" className={clsx(pathname === '/swap' && styles.activeLink)}>
              Swap
            </Link>
            <a href="#">
              Liquidity
            </a>
            <a href="#" className={styles.pointsText}>
              Points
            </a>
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
          <a href="#">
            Docs
          </a>
          <ActionButton className={styles.launchAppButton}>
            Launch App
          </ActionButton>
        </div>
      </section>
    </header>
  );
}

export default Header;
