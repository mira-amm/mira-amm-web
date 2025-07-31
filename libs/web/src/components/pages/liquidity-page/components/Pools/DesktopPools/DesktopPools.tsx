import {PoolData} from "@/src/hooks/usePoolsData";
import {DesktopPoolRow} from "./DesktopPoolRow";
import {useIsConnected} from "@fuels/react";
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
} from "@/meshwave-ui/table";
import {cn} from "@/src/utils/cn";

export function DesktopPools({
  poolsData,
  orderBy,
  handleSort,
}: {
  poolsData: PoolData[] | undefined;
  orderBy: string;
  handleSort: (key: string) => void;
}) {
  const {isConnected} = useIsConnected();

  if (!poolsData) return null;

  const thBase =
    "px-6 py-4 text-base leading-[19px]  text-foreground whitespace-nowrap overflow-hidden text-ellipsis";
  return (
    <Table className="md:table table-fixed desktopOnly p-5">
      <TableHeader>
        <TableRow>
          <TableHead className={cn(thBase, "w-[230px] text-left")}>
            Pools
          </TableHead>
          <TableHead className={cn(thBase, "w-[20%] text-center")}>
            APR
          </TableHead>
          <TableHead className={cn(thBase, "w-[15%] text-center")}>
            24H Volume
          </TableHead>
          <TableHead
            className={cn(thBase, "w-[15%] flex w-full h-full justify-center")}
          >
            <SortableColumn
              title="$ TVL"
              columnKey="tvlUSD"
              orderBy={orderBy}
              onSort={handleSort}
              className=""
            />
          </TableHead>
          <TableHead
            className={cn(
              "py-4 text-base leading-[19px]  text-content-tertiary whitespace-nowrap overflow-hidden text-ellipsis",
              "w-[20%] text-center"
            )}
          >
            {isConnected && <Link href="/liquidity/create-pool">
              <Button>Create Pool</Button>
            </Link>}
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
              className="text-center text-base text-content-tertiary px-6 py-4"
            >
              No pools available
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
