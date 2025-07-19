import {usePoolDetails} from "../usePoolDetails";
import CoinPair from "@/src/components/common/CoinPair/CoinPair";
import Link from "next/link";
import clsx from "clsx";
import {PoolData} from "@/src/hooks/usePoolsData";
import {AprBadge} from "@/src/components/common/AprBadge/AprBadge";
import {usePoolNameAndMatch} from "@/src/hooks/usePoolNameAndMatch";
import {Button} from "@/meshwave-ui/Button";
import {TableCell, TableRow} from "@/meshwave-ui/table";
import {cn} from "@/src/utils/cn";

const cellBase =
  "px-6 py-4 whitespace-nowrap overflow-hidden text-ellipsis text-center";

export function DesktopPoolRow({poolData}: {poolData: PoolData}) {
  const {poolKey, aprValue, volumeValue, tvlValue, isStablePool, poolId} =
    usePoolDetails(poolData);

  const tvlActual = parseInt(tvlValue?.replace(/[^0-9]+/g, ""), 10);
  const {isMatching} = usePoolNameAndMatch(poolKey);

  return (
    <TableRow key={poolKey}>
      <TableCell className={cn(cellBase, "text-left")}>
        <CoinPair
          firstCoin={poolId[0].bits}
          secondCoin={poolId[1].bits}
          isStablePool={isStablePool}
          withPoolDescription
        />
      </TableCell>

      <TableCell
        className={cn(
          cellBase,
          "overflow-visible",
          !isMatching && !aprValue && "text-content-dimmed-light"
        )}
      >
        {isMatching ? (
          <div className="flex justify-center">
            <AprBadge
              aprValue={aprValue}
              poolKey={poolKey}
              tvlValue={tvlActual}
            />
          </div>
        ) : (
          aprValue
        )}
      </TableCell>

      <TableCell className={cellBase}>{volumeValue}</TableCell>
      <TableCell className={cellBase}>{tvlValue}</TableCell>

      <TableCell className={cellBase}>
        <Link href={`/liquidity/add?pool=${poolKey}`}>
          <Button variant="outline">Add Liquidity</Button>
        </Link>
      </TableCell>
    </TableRow>
  );
}
