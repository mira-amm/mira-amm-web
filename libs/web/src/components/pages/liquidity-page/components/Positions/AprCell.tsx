import {Position} from "@/src/hooks/usePositions";
import {buildPoolId} from "mira-dex-ts";
import {usePoolNameAndMatch} from "@/src/hooks/usePoolNameAndMatch";
import {usePoolAPR} from "@/src/hooks";
import {createPoolKey} from "@/src/utils/common";
import {AprBadge} from "@/src/components/common/AprBadge/AprBadge";
import {DefaultLocale} from "@/src/utils/constants";

const AprCell = ({position}: {position: Position}) => {
  const assetIdA = position.token0Item.token0Position[0].bits;
  const assetIdB = position.token1Item.token1Position[0].bits;
  const isStablePool = position.isStable;
  const poolId = buildPoolId(assetIdA, assetIdB, isStablePool);
  const poolKey = createPoolKey(poolId);
  const {apr} = usePoolAPR(poolId);
  const {isMatching} = usePoolNameAndMatch(poolKey);

  const aprValue = apr
    ? `${apr.apr.toLocaleString(DefaultLocale, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}%`
    : null;

  const tvlValue = apr?.tvlUSD;

  return (
    <div className="text-center mx-auto text-base font-alt">
      {isMatching ? (
        <AprBadge
          aprValue={aprValue}
          poolKey={poolKey}
          tvlValue={tvlValue}
          background="black"
        />
      ) : (
        aprValue
      )}
    </div>
  );
};

export default AprCell;
