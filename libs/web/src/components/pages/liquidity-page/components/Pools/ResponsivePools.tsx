import {PoolData} from "@/src/hooks/usePoolsData";
import {usePoolDetails} from "./usePoolDetails";
import {usePoolNameAndMatch} from "@/src/hooks";
import {useRouter} from "next/navigation";
import CoinPair from "@/src/components/common/CoinPair/CoinPair";
import {Button} from "@/meshwave-ui/Button";
import {Divider} from "@/meshwave-ui/divider";
import {cn} from "@/shadcn-ui/utils";

export function ResponsivePools({
  poolsData,
  orderBy,
  handleSort,
  className,
}: {
  poolsData: PoolData[] | undefined;
  orderBy: string;
  handleSort: (key: string) => void;
  className?: string;
}) {
  if (!poolsData) {
    return null;
  }

  return (
    <div className={cn("gap-5 flex flex-col", className)}>
      {poolsData.map((poolData) => {
        return <PoolItem key={poolData.id} poolData={poolData} />;
      })}
    </div>
  );
}

function PoolItem({poolData}: {poolData: PoolData}) {
  const router = useRouter();
  const {
    poolKey,
    aprValue,
    volumeValue,
    tvlValue,
    poolDescription,
    isStablePool,
    poolId,
  } = usePoolDetails(poolData);

  const handleAddClick = () => {
    router.push(`/liquidity/add?pool=${poolKey}`);
  };

  const tvlActual = tvlValue
    ? parseInt(tvlValue?.replace(/[^0-9]+/g, ""), 10)
    : 0;

  //Checks if the pool with rewards matches the current pool
  const {isMatching} = usePoolNameAndMatch(poolKey);
  // card box
  // it has the border, gap 20px,
  // padding of approximately 30px
  // TODO: Background color is not dark gray
  return (
    <div className="gap-5 p-6 border-border-secondary border-[12px] rounded-ten flex flex-col bg-[#F5F5F5]">
      {/* Pool name, fee, type, images */}
      {/* */}
      <CoinPair
        firstCoin={poolId[0].bits}
        secondCoin={poolId[1].bits}
        isStablePool={isStablePool}
        withPoolDescription={true}
      />

      <Divider size="sm" />

      {/* Pool info: APR, 24h volume, TVL*/}
      {/* Padding 25px, flex col align-start, justify-space-between, gap 8px */}
      <div className="flex flex-col gap-4 p-4 font-alt bg-white rounded-ten text-sm">
        <div>
          <span> APR: </span>{" "}
          <span className="text-content-tertiary">{aprValue}</span>
        </div>
        <div>
          <span> 24 Volume: </span>{" "}
          <span className="text-content-tertiary">{volumeValue}</span>
        </div>
        <div>
          <span> TVL: </span>{" "}
          <span className="text-content-tertiary">{tvlValue}</span>
        </div>
      </div>
      {/* Add liquidity button */}
      <Button variant="outline" onClick={handleAddClick}>
        {" "}
        Add Liquidity{" "}
      </Button>
      {/**/}
    </div>
  );
}

//
// export function MobilePools({
//   poolsData,
//   orderBy,
//   handleSort,
// }: {
//   poolsData: PoolData[] | undefined;
//   orderBy: string;
//   handleSort: (key: string) => void;
// }) {
//   if (!poolsData) {
//     return null;
//   }
//
//   return (
//     <div className="mobileOnly rounded-ten bg-background-grey-dark border-border-secondary border-[12px] dark:border-0 dark:bg-background-grey-dark">
//       <Table
//         className={cn(
//           "mobileOnly text-slate-400 text-sm bg-background-grey-dark"
//         )}
//         tableParentClassName="border-0"
//       >
//         <TableHeader>
//           <TableRow className="flex items-center">
//             <TableHead className=" flex items-center">SORT BY:</TableHead>
//             <SortableColumn
//               title="TVL"
//               columnKey="tvlUSD"
//               orderBy={orderBy}
//               onSort={handleSort}
//             />
//           </TableRow>
//         </TableHeader>
//       </Table>
//
//       <div className="mobileOnly flex flex-col p-4 rounded-md bg-background-grey-dark">
//         {poolsData.length > 0 ? (
//           poolsData.map((poolData, index) => (
//             <Fragment key={poolData.id}>
//               <MobilePoolItem poolData={poolData} />
//               {index !== poolsData.length - 1 && (
//                 <div className="h-px bg-[var(--background-grey-light)] my-4 -mx-4" />
//               )}
//             </Fragment>
//           ))
//         ) : (
//           <p className="text-center text-[16px]  text-[color:var(--content-tertiary)]">
//             No pools available
//           </p>
//         )}
//       </div>
//     </div>
//   );
// }
