import MobilePoolItem
  from "@/src/components/pages/liquidity-page/components/Pools/MobilePools/MobilePoolItem/MobilePoolItem";

import styles from './MobilePools.module.css';
import {Fragment} from "react";
import {clsx} from "clsx";
import {PoolData} from "@/src/hooks/usePoolsData";

type Props = {
  poolsData: PoolData[] | undefined;
};

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

        return (
          <Fragment key={poolData.id}>
            <MobilePoolItem poolData={poolData} />
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
