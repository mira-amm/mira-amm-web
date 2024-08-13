import MobilePositions
  from "@/src/components/pages/liquidity-page/components/Positions/MobilePositions/MobilePositions";

import styles from './Positions.module.css';
import DesktopPositions
  from "@/src/components/pages/liquidity-page/components/Positions/MobilePositions/DesktopPositions/DesktopPositions";

const Pools = () => {
  return (
    <section className={styles.positions}>
      <p className={styles.positionsTitle}>
        Your Positions
      </p>
      <MobilePositions />
      <DesktopPositions />
    </section>
  );
};

export default Pools;
