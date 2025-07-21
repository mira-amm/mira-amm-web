import {usePoolDetails} from "../../usePoolDetails";
import CoinPair from "@/src/components/common/CoinPair/CoinPair";
import {InfoBlock} from "@/src/components/common";
import {useRouter} from "next/navigation";
import {PoolData} from "@/src/hooks/usePoolsData";
import { AprBadge } from "@/src/components/common/AprBadge/AprBadge";
import { usePoolNameAndMatch } from "@/src/hooks/usePoolNameAndMatch";
import {Button} from "@/meshwave-ui/Button";

export function MobilePoolItem({poolData}: {
 poolData: PoolData
}){
  const router = useRouter();
  const {
    poolKey,
    aprValue,
    volumeValue,
    tvlValue,
    poolDescription,
    isStablePool,
    poolId,
  } = usePoolDetails(poolData)

  const handleAddClick = () => {
    router.push(`/liquidity/add?pool=${poolKey}`);
  };

  const tvlActual = tvlValue
    ? parseInt(tvlValue?.replace(/[^0-9]+/g, ""), 10)
    : 0;

  //Checks if the pool with rewards matches the current pool
  const {isMatching} = usePoolNameAndMatch(poolKey);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        <CoinPair
          firstCoin={poolId[0].bits}
          secondCoin={poolId[1].bits}
          isStablePool={isStablePool}
        />
        <div className="flex justify-between gap-4">
          {isMatching ? (
            <div className="">
              <p className="">APR</p>
              <AprBadge
                small={true}
                aprValue={aprValue}
                poolKey={poolKey || ""}
                tvlValue={tvlActual}
              />
            </div>
          ) : (
            <div className="">
              <InfoBlock title="APR" value={aprValue} type="positive" />
            </div>
          )}
          <div className="">
            <InfoBlock title="24H Volume" value={volumeValue} />
          </div>
          <div className="">
            <InfoBlock title="TVL" value={tvlValue} />
          </div>
        </div>
        <p className="text-[12px] leading-[14px] text-[#d4b226]">
          {poolDescription}
        </p>
      </div>

      <Button
        variant="outline"
        onClick={handleAddClick}
        className="font-medium leading-[19px] w-[177px]"
        size="lg"
      >
        Add Liquidity
      </Button>
    </div>
  );
};
