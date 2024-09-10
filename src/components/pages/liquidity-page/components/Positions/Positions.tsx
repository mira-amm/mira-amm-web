import MobilePositions
  from "@/src/components/pages/liquidity-page/components/Positions/MobilePositions/MobilePositions";

import styles from './Positions.module.css';
import DesktopPositions
  from "@/src/components/pages/liquidity-page/components/Positions/MobilePositions/DesktopPositions/DesktopPositions";
import usePositions from "@/src/hooks/usePositions";
import DocumentIcon from "@/src/components/icons/Document/DocumentIcon";
import useBalances from "@/src/hooks/useBalances/useBalances";

const Positions = () => {
  const { balances } = useBalances();
  const positions = usePositions({ balances });

  const noPositions = positions.every(positions => !positions.lpBalance);
  const filteredPositions = positions.filter(position => position.lpBalance);

  return (
    <section className={styles.positions}>
      <p className={styles.positionsTitle}>
        Your Positions
      </p>
      {noPositions ? (
        <div className={styles.positionsFallback}>
          <div className={styles.fallbackTop}>
            <div className={styles.icon}>
              <DocumentIcon />
            </div>
            <p>Your liquidity will appear here</p>
          </div>
          {/*<button className={styles.viewArchivedButton}>*/}
          {/*  View archive positions*/}
          {/*</button>*/}
        </div>
      ) : (
        <>
          <MobilePositions positions={filteredPositions} />
          <DesktopPositions positions={filteredPositions} />
        </>
      )}
    </section>
  );
};

export default Positions;
