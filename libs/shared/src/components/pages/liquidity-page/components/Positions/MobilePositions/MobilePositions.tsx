import MobilePositionItem from "@/src/components/pages/liquidity-page/components/Positions/MobilePositions/MobilePositionItem/MobilePositionItem";

import styles from "./MobilePositions.module.css";
import {PoolId} from "mira-dex-ts";
import {Fragment, useCallback} from "react";
import {createPoolKey} from "@/src/utils/common";
import {useRouter} from "next/navigation";
import {clsx} from "clsx";
import {Position} from "@/src/hooks/usePositions";

type Props = {
  positions: Position[] | undefined;
};

const MobilePositions = ({positions}: Props) => {
  const router = useRouter();

  const openPosition = useCallback(
    (poolId: PoolId) => {
      const poolKey = createPoolKey(poolId);
      router.push(`/liquidity/position?pool=${poolKey}`);
    },
    [router],
  );

  if (!positions) {
    return null;
  }

  return (
    <div className={clsx(styles.mobilePositions, "mobileOnly")}>
      {positions.map((position, index) => {
        return (
          <Fragment key={createPoolKey(position.poolId)}>
            <MobilePositionItem
              position={position}
              onClick={() => openPosition(position.poolId)}
            />
            {index !== positions.length - 1 && (
              <div className={styles.separator} />
            )}
          </Fragment>
        );
      })}
    </div>
  );
};

export default MobilePositions;
