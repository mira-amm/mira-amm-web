import styles from "./DesktopPools.module.css";
import {clsx} from "clsx";
import {PoolData} from "@/src/hooks/usePoolsData";
import DesktopPoolRow from "./DesktopPoolRow";
import Link from "next/link";
import SortableColumn from "@/src/components/common/SortableColumn/SortableColumn";
import {Button} from "@/meshwave-ui/Button";

export function DesktopPools({
  poolsData,
  orderBy,
  handleSort,
}: {
  poolsData: PoolData[] | undefined;
  orderBy: string;
  handleSort: (key: string) => void;
}) {
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
              <Button className="bg-accent-primary text-old-mira-text border border-accent-primary shadow-[1px_1px_20px_0_#a1db0b4d] hover:shadow-[1px_1px_30px_0_#a1db0b4d] hover:bg-old-mira-active-btn cursor-pointer">
                Create Pool
              </Button>
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
}
