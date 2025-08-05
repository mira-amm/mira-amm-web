import {PoolData} from "@/src/hooks/usePoolsData";
import {usePoolDetails} from "./usePoolDetails";
import {useRouter} from "next/navigation";
import CoinPair from "@/src/components/common/CoinPair/CoinPair";
import {Button} from "@/meshwave-ui/Button";
import {Divider} from "@/meshwave-ui/divider";
import {cn} from "@/shadcn-ui/utils";

export function ResponsivePools({
  poolsData,
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
  const {poolKey, aprValue, volumeValue, tvlValue, isStablePool, poolId} =
    usePoolDetails(poolData);

  const handleAddClick = () => {
    router.push(`/liquidity/add?pool=${poolKey}`);
  };

  // card box
  // it has the border, gap 20px,
  // padding of approximately 30px
  // TODO: Background color is not dark gray
  return (
    <div className="gap-5 p-6 border-border-secondary border-[12px] rounded-ten flex flex-col bg-[#F5F5F5]">
      <CoinPair
        firstCoin={poolId[0].bits}
        secondCoin={poolId[1].bits}
        isStablePool={isStablePool}
        withPoolDescription={true}
      />

      <Divider size="sm" />

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
      <Button variant="outline" onClick={handleAddClick}>
        {" "}
        Add Liquidity{" "}
      </Button>
    </div>
  );
}
