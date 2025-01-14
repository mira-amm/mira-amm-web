import useAssetMetadata from "@/src/hooks/useAssetMetadata";
import {pairsWithRewards} from "@/src/utils/constants";
import {PoolId} from "mira-dex-ts";

const usePoolNameAndMatch = (poolId: PoolId): {isMatching: boolean} => {
  const {symbol: firstSymbol} = useAssetMetadata(poolId[0]?.bits);
  const {symbol: secondSymbol} = useAssetMetadata(poolId[1]?.bits);

  const poolName = `${firstSymbol}/${secondSymbol}`;
  const isMatching = pairsWithRewards.some((pair) => pair === poolName);

  return {isMatching};
};

export default usePoolNameAndMatch;
