import MobilePositions from "@/src/components/pages/liquidity-page/components/Positions/MobilePositions/MobilePositions";

import styles from "./Positions.module.css";
import DesktopPositions from "@/src/components/pages/liquidity-page/components/Positions/MobilePositions/DesktopPositions/DesktopPositions";
import usePositions from "@/src/hooks/usePositions";
import PositionsLoader from "./PositionsLoader/PositionsLoader";
import DocumentIcon from "@/src/components/icons/Document/DocumentIcon";
import { useMemo } from "react";

const POSITIONS_COUNT = "positions-count";

const Positions = (): JSX.Element => {
  const { data, isLoading } = usePositions();

  const positionsCount = useMemo(() => {
    const savedCount = localStorage.getItem(POSITIONS_COUNT);
    const initialCount = savedCount ? parseInt(savedCount) : 0;

    if (data) {
      const freshCount = data.length;
      if (freshCount !== initialCount) {
        localStorage.setItem(POSITIONS_COUNT, freshCount.toString());
        return freshCount;
      }
    }

    return initialCount;
  }, [data]);

  return (
    <section className={styles.positions}>
      <p className={styles.positionsTitle}>Your Positions</p>
      {(!data && !isLoading) || data?.length === 0 ? (
        <div className={styles.positionsFallback}>
          <div className={styles.fallbackTop}>
            <div className={styles.icon}>
              <DocumentIcon />
            </div>
            <p>Your liquidity will appear here</p>
          </div>
        </div>
      ) : data ? (
        <DesktopPositions positions={data} />
      ) : (
        <PositionsLoader count={positionsCount} />
      )}
      <MobilePositions positions={data} />
    </section>
  );
};

export default Positions;
