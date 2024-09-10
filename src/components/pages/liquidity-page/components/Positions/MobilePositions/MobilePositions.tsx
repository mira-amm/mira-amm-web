import MobilePositionItem
  from "@/src/components/pages/liquidity-page/components/Positions/MobilePositions/MobilePositionItem/MobilePositionItem";

import styles from "./MobilePositions.module.css";
import {isMobile} from "react-device-detect";
import {PoolId} from "mira-dex-ts";
import {AssetId, CoinQuantity} from "fuels";
import {Fragment} from "react";

type Props = {
  positions: { poolId: PoolId, lpAssetId: AssetId, lpBalance: CoinQuantity | undefined }[];
};

const MobilePositions = ({ positions }: Props) => {
  if (!isMobile) {
    return null;
  }

  return (
    <div className={styles.mobilePositions}>
      {positions.map(((position, index) => {
        return (
          <Fragment key={position.lpAssetId.bits}>
            <MobilePositionItem position={position} />
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
