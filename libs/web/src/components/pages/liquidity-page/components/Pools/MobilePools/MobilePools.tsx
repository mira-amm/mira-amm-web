import {MobilePoolItem} from "@/src/components/pages/liquidity-page/components/Pools/MobilePools/MobilePoolItem/MobilePoolItem";
import {Fragment} from "react";
import {clsx} from "clsx";
import {PoolData} from "@/src/hooks/usePoolsData";
import SortableColumn from "@/src/components/common/SortableColumn/SortableColumn";
import {Table, TableHead, TableHeader, TableRow} from "@/meshwave-ui/table";

export function MobilePools({
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
    <div className="mobileOnly rounded-2xl bg-background-grey-dark border-border-secondary border-[12px] dark:border-0 dark:bg-background-grey-dark">
      <Table
        className={clsx(
          "mobileOnly text-slate-400 text-sm bg-[var(--background-grey-dark)]",
          "rounded-lg px-2 px-5 py-2 mb-2"
        )}
      >
        <TableHeader>
          <TableRow className="flex items-center">
            <TableHead className="font-medium flex items-center text-content-dimmed-dark">
              SORT BY:
            </TableHead>
            <SortableColumn
              title="TVL"
              columnKey="tvlUSD"
              orderBy={orderBy}
              onSort={handleSort}
            />
          </TableRow>
        </TableHeader>
      </Table>

      <div className="mobileOnly flex flex-col p-4 rounded-md bg-[var(--background-grey-dark)]">
        {poolsData.length > 0 ? (
          poolsData.map((poolData, index) => (
            <Fragment key={poolData.id}>
              <MobilePoolItem poolData={poolData} />
              {index !== poolsData.length - 1 && (
                <div className="h-px bg-[var(--background-grey-light)] my-4 -mx-4" />
              )}
            </Fragment>
          ))
        ) : (
          <p className="text-center text-[16px] font-medium text-[color:var(--content-tertiary)]">
            No pools available
          </p>
        )}
      </div>
    </div>
  );
}
