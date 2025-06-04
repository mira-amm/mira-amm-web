import {clsx} from "clsx";
import {PoolData} from "@/src/hooks/usePoolsData";
import DesktopPoolRow from "./DesktopPoolRow";
import Link from "next/link";
import SortableColumn from "@/src/components/common/SortableColumn/SortableColumn";
import {Button} from "@/meshwave-ui/Button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/meshwave-ui/Table";

export function DesktopPools({
  poolsData,
  orderBy,
  handleSort,
}: {
  poolsData: PoolData[] | undefined;
  orderBy: string;
  handleSort: (key: string) => void;
}) {
  if (!poolsData) return null;

  const thBase =
    "px-6 py-4 text-[16px] leading-[19px] font-medium text-[color:var(--content-tertiary)] " +
    "border-b border-[color:var(--background-grey-darker)] whitespace-nowrap overflow-hidden text-ellipsis";

  return (
    <Table className="md:table w-full table-fixed border-collapse rounded-2xl bg-background-grey-dark desktopOnly">
      <TableHeader>
        <TableRow>
          <TableHead className={clsx(thBase, "w-[30%] text-left")}>
            Pools
          </TableHead>
          <TableHead className={clsx(thBase, "w-[20%] text-center")}>
            APR
          </TableHead>
          <TableHead className={clsx(thBase, "w-[15%] text-center")}>
            24H Volume
          </TableHead>
          <TableHead className={clsx(thBase, "w-[15%] text-center")}>
            <SortableColumn
              title="TVL"
              columnKey="tvlUSD"
              orderBy={orderBy}
              onSort={handleSort}
            />
          </TableHead>
          <TableHead className={clsx(thBase, "w-[20%] text-center")}>
            <Link href="/liquidity/create-pool">
              <Button>Create Pool</Button>
            </Link>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {poolsData.length > 0 ? (
          poolsData.map((poolData) => (
            <DesktopPoolRow key={poolData.id} poolData={poolData} />
          ))
        ) : (
          <TableRow>
            <TableCell
              colSpan={5}
              className="text-center text-[16px] font-medium text-[color:var(--content-tertiary)] px-6 py-4"
            >
              No pools available
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
