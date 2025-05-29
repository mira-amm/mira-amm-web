import styles from "./DesktopPools.module.css";
import {clsx} from "clsx";
import {PoolData} from "@/src/hooks/usePoolsData";
import DesktopPoolRow from "./DesktopPoolRow";
import {ActionButton}from "@/src/components/common";
import Link from "next/link";
import SortableColumn from "@/src/components/common/SortableColumn/SortableColumn";

export function DesktopPools({poolsData, orderBy, handleSort}: {
  poolsData: PoolData[] | undefined;
  orderBy: string;
  handleSort: (key: string) => void;
}){

  if (!poolsData) {
    return null;
  }

  return (
    <table className={clsx(styles.desktopPools, "desktopOnly")}>
      <thead>
        <tr>
          <th>Pools</th>
          <th>APR</th>
          <th>24H Volume</th>
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
          <th>
            <Link href="/liquidity/create-pool">
              <ActionButton className={styles.createButton}>
                Create Pool
              </ActionButton>
            </Link>
          </th>
        </tr>
      </thead>
      <tbody>
        {poolsData && poolsData.length > 0 ? (
          poolsData.map((poolData) => (
            <DesktopPoolRow key={poolData.id} poolData={poolData} />
          ))
        ) : (
          <tr>
            <td colSpan={5} className={styles.noData}>
              No pools available
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
};
