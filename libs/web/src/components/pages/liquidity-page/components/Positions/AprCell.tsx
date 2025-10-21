import {Position} from "@/src/hooks/usePositions";
import {buildPoolId} from "mira-dex-ts";
import {usePoolNameAndMatch} from "@/src/hooks/usePoolNameAndMatch";
import {usePoolAPR} from "@/src/hooks";
import {createPoolKey} from "@/src/utils/common";
import {AprBadge} from "@/src/components/common/AprBadge/AprBadge";
import {DefaultLocale} from "@/src/utils/constants";
import type {UnifiedPosition} from "./Positions";

const AprCell = ({position}: {position: Position | UnifiedPosition}) => {
  const assetIdA = position.token0Item.token0Position[0].bits;
  const assetIdB = position.token1Item.token1Position[0].bits;

  // Handle both V1 and V2 positions
  // For APR queries, we always need a V1-style PoolId (asset pair + stability)
  // V2 positions are always volatile (not stable)
  const isStablePool = (position as any).isV2
    ? false
    : (position as Position).isStable;
  const poolId = buildPoolId(assetIdA, assetIdB, isStablePool);

  // For pool key, use the actual poolId (BN for V2, built poolId for V1)
  const poolKey = (position as any).isV2
    ? createPoolKey(position.poolId)
    : createPoolKey(poolId);
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
