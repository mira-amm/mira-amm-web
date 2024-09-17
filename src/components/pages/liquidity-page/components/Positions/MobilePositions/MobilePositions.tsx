import MobilePositionItem
  from "@/src/components/pages/liquidity-page/components/Positions/MobilePositions/MobilePositionItem/MobilePositionItem";

import styles from "./MobilePositions.module.css";
import {PoolId} from "mira-dex-ts";
import {Fragment, useCallback} from "react";
import {createPoolKey} from "@/src/utils/common";
import {useRouter} from "next/navigation";
import {clsx} from "clsx";

type Props = {
  positions: any[] | undefined;
};

const MobilePositions = ({ positions }: Props) => {
  const router = useRouter();

  const openPosition = useCallback((poolId: PoolId) => {
    const poolKey = createPoolKey(poolId);
    router.push(`/liquidity/position?pool=${poolKey}`);
  }, [router]);

  if (!positions) {
    return null;
  }

  return (
    <div className={clsx(styles.mobilePositions, 'mobileOnly')}>
      {positions.map(((position, index) => {
        const { bits: coinAAssetId } = position[0][0];
        const { bits: coinBAssetId } = position[1][0];
        const key = coinAAssetId.toString() + '-' + coinBAssetId.toString();
        const poolId = [position[0][0], position[1][0], false] as PoolId;

        return (
          <Fragment key={key}>
            <MobilePositionItem position={position} onClick={() => openPosition(poolId)}/>
            {index !== positions.length - 1 && (
              <div className={styles.separator} />
            )}
          </Fragment>
        );
      }))}
    </div>
  );
};

export default MobilePositions;
