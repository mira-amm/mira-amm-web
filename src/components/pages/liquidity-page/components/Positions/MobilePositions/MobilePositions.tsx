import MobilePositionItem
  from "@/src/components/pages/liquidity-page/components/Positions/MobilePositions/MobilePositionItem/MobilePositionItem";

import styles from "./MobilePositions.module.css";
import {isMobile} from "react-device-detect";
import {PoolId} from "mira-dex-ts";
import {AssetId, CoinQuantity} from "fuels";
import {Fragment, useCallback} from "react";
import {createPoolKey} from "@/src/utils/common";
import {useRouter} from "next/navigation";

type Props = {
  positions: { poolId: PoolId, lpAssetId: AssetId, lpBalance: CoinQuantity | undefined }[];
};

const MobilePositions = ({ positions }: Props) => {
  const router = useRouter();

  const openPosition = useCallback((poolId: PoolId) => {
    const poolKey = createPoolKey(poolId);
    router.push(`/liquidity/position?pool=${poolKey}`);
  }, [router]);

  if (!isMobile) {
    return null;
  }

  return (
    <div className={styles.mobilePositions}>
      {positions.map(((position, index) => {
        return (
          <Fragment key={position.lpAssetId.bits}>
            <MobilePositionItem position={position} onClick={() => openPosition(position.poolId)}/>
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
