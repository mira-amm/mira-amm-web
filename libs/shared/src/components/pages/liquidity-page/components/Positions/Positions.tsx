import MobilePositions from "@/src/components/pages/liquidity-page/components/Positions/MobilePositions/MobilePositions";

import styles from "./Positions.module.css";
import DesktopPositions from "@/src/components/pages/liquidity-page/components/Positions/MobilePositions/DesktopPositions/DesktopPositions";
import {useIsConnected} from "@fuels/react";
import usePositions from "@/src/hooks/usePositions";
import PositionsLoader from "./PositionsLoader/PositionsLoader";
import DocumentIcon from "@/src/components/icons/Document/DocumentIcon";
import {POSITIONS_SKELTON_COUNT} from "@/src/utils/constants";

const Positions = () => {
  const {isConnected} = useIsConnected();
  const {data, isLoading} = usePositions();

  return (
    <section className={styles.positions}>
      <p className={styles.positionsTitle}>Your Positions</p>
      {!isConnected || data?.length === 0 ? (
        <div className={styles.positionsFallback}>
          <div className={styles.fallbackTop}>
            <div className={styles.icon}>
              <DocumentIcon />
            </div>
            <p>Your liquidity will appear here</p>
          </div>
        </div>
      ) : data && data.length > 0 && !isLoading ? (
        <>
          <DesktopPositions positions={data} />
          <MobilePositions positions={data} />
        </>
      ) : (
        <PositionsLoader count={POSITIONS_SKELTON_COUNT} />
      )}
    </section>
  );
};

export default Positions;
