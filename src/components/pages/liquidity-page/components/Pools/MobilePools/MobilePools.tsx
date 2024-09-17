import MobilePoolItem
  from "@/src/components/pages/liquidity-page/components/Pools/MobilePools/MobilePoolItem/MobilePoolItem";

import styles from './MobilePools.module.css';
import {PoolMetadata} from "mira-dex-ts";
import {createPoolKey} from "@/src/utils/common";
import {Fragment} from "react";
import {clsx} from "clsx";

type Props = {
  poolsData: (PoolMetadata | null | undefined)[] | undefined;
}

const MobilePools = ({ poolsData }: Props) => {
  if (!poolsData) {
    return null;
  }

  return (
    <div className={clsx(styles.mobilePools, 'mobileOnly')}>
      {poolsData.map(poolData => {
        if (!poolData) {
          return null;
        }

        const { poolId } = poolData;
        const key = createPoolKey(poolId)

        return (
          <Fragment key={key}>
            <MobilePoolItem poolKey={key} />
            {poolsData.indexOf(poolData) !== poolsData.length - 1 && (
              <div className={styles.separator}/>
            )}
          </Fragment>
        );
      })}
    </div>
  );
};

export default MobilePools;
