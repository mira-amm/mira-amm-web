import MobilePositions
  from "@/src/components/pages/liquidity-page/components/Positions/MobilePositions/MobilePositions";

import styles from './Positions.module.css';
import DesktopPositions
  from "@/src/components/pages/liquidity-page/components/Positions/MobilePositions/DesktopPositions/DesktopPositions";
import usePositions from "@/src/hooks/usePositions";
import DocumentIcon from "@/src/components/icons/Document/DocumentIcon";
import LoaderV2 from "@/src/components/common/LoaderV2/LoaderV2";

const Positions = () => {
  const { data, isLoading  } = usePositions();

  const noPositions = data?.every(position => !position.lpBalance) ?? true;
  const filteredPositions = data?.filter(position => Boolean(position.lpBalance));

  return (
    <section className={styles.positions}>
      <p className={styles.positionsTitle}>
        Your Positions
      </p>
      {isLoading ? (
        <div className={styles.positionsFallback}>
          <LoaderV2/>
          <p>Loading positions...</p>
        </div>
      ) : noPositions ? (
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
