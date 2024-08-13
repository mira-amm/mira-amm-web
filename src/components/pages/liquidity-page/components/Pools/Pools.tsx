import MobilePools from "@/src/components/pages/liquidity-page/components/Pools/MobilePools/MobilePools";
import DesktopPools from "@/src/components/pages/liquidity-page/components/Pools/DesktopPools/DesktopPools";

import styles from './Pools.module.css';

const Pools = () => {
  return (
    <section className={styles.pools}>
      <p className={styles.poolsTitle}>
        All Pools
      </p>
      <MobilePools />
      <DesktopPools />
    </section>
  );
};

export default Pools;
