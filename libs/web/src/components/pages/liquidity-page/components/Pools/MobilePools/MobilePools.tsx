import MobilePoolItem from "@/src/components/pages/liquidity-page/components/Pools/MobilePools/MobilePoolItem/MobilePoolItem";

import styles from "./MobilePools.module.css";
import {Fragment} from "react";
import {clsx} from "clsx";
import {PoolData} from "@/src/hooks/usePoolsData";
import SortableColumn from "@/src/components/common/SortableColumn/SortableColumn";
import ActionButton from "@/src/components/common/ActionButton/ActionButton";
import {useCallback} from "react";
import {useRouter} from "next/navigation";

type Props = {
  poolsData: PoolData[] | undefined;
  orderBy: string;
  handleSort: (key: string) => void;
};

const MobilePools = ({poolsData, orderBy, handleSort}: Props) => {
  if (!poolsData) {
    return null;
  }
  const router = useRouter();

  const handleCreatePoolClick = useCallback(() => {
    router.push("/liquidity/create-pool");
  }, [router]);

  return (
    <div className={clsx("mobileOnly")}>
      <div className={styles.sortTable}>
        <table className={clsx(styles.mobilePoolsSort, "mobileOnly")}>
          <thead>
            <tr className="mc-type-m">
              <th>SORT BY:</th>
              {/* <SortableColumn
              title="24H Volume"
              columnKey="volumeUSD"
              orderBy={orderBy}
              onSort={handleSort}
            /> */}
              <SortableColumn
                title="TVL"
                columnKey="tvlUSD"
                orderBy={orderBy}
                onSort={handleSort}
              />
            </tr>
          </thead>
        </table>
        <div className={styles.actionButtonDiv}>
          <ActionButton
            className={clsx("mobileOnly")}
            onClick={handleCreatePoolClick}
            fullWidth
            size="big"
          >
            Create Pool
          </ActionButton>
        </div>
      </div>
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
          <p className={clsx(styles.noData, "mc-type-m")}>No pools available</p>
        )}
      </div>
    </div>
  );
};

export default MobilePools;
