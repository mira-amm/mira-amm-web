import MobilePositions
  from "@/src/components/pages/liquidity-page/components/Positions/MobilePositions/MobilePositions";

import styles from './Positions.module.css';
import DesktopPositions
  from "@/src/components/pages/liquidity-page/components/Positions/MobilePositions/DesktopPositions/DesktopPositions";
import usePositions from "@/src/hooks/usePositions";
import DocumentIcon from "@/src/components/icons/Document/DocumentIcon";

const Positions = () => {
  const positions = usePositions();

  return (
    <section className={styles.positions}>
      <p className={styles.positionsTitle}>
        Your Positions
      </p>
      <MobilePositions positions={positions} />
      <DesktopPositions positions={positions} />
      {!positions && (
        <div className={styles.positionsFallback}>
          <div className={styles.fallbackTop}>
            <div className={styles.icon}>
              <DocumentIcon />
            </div>
            <p>Your liquidity will appear here</p>
          </div>
          <button className={styles.viewArchivedButton}>
            View archive positions
          </button>
        </div>
      )}
    </section>
  );
};

export default Positions;
