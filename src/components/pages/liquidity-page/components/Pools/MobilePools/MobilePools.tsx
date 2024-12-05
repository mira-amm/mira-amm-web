import MobilePoolItem from "@/src/components/pages/liquidity-page/components/Pools/MobilePools/MobilePoolItem/MobilePoolItem";

import styles from "./MobilePools.module.css";
import {Fragment} from "react";
import {clsx} from "clsx";
import {PoolData} from "@/src/hooks/usePoolsData";
import SortableColumn from "@/src/components/common/SortableColumn/SortableColumn";

type Props = {
  poolsData: PoolData[] | undefined;
  orderBy: string;
  handleSort: (key: string) => void;
};

const MobilePools = ({poolsData, orderBy, handleSort}: Props) => {
  if (!poolsData) {
    return null;
  }

  return (
    <div className={clsx("mobileOnly")}>
      <table className={clsx(styles.mobilePoolsSort, "mobileOnly")}>
        <thead>
          <tr>
            <th>SORT BY:</th>
            <SortableColumn
              title="24H Volume"
              columnKey="volumeUSD"
              orderBy={orderBy}
              onSort={handleSort}
            />
            <SortableColumn
              title="TVL"
              columnKey="tvlUSD"
              orderBy={orderBy}
              onSort={handleSort}
            />
          </tr>
        </thead>
      </table>
      <div className={clsx(styles.mobilePools, "mobileOnly")}>
        {poolsData && poolsData.length > 0 ? (
          poolsData.map((poolData) => {
            return (
              <Fragment key={poolData.id}>
                <MobilePoolItem poolData={poolData} />
                {poolsData.indexOf(poolData) !== poolsData.length - 1 && (
                  <div className={styles.separator} />
                )}
              </Fragment>
            );
          })
        ) : (
          <p className={styles.noData}>No pools available</p>
        )}
      </div>
    </div>
  );
};

export default MobilePools;
