import useAssetMetadata from "@/src/hooks/useAssetMetadata";
import boostRewards from "@/src/models/campaigns.json";
import {PoolId} from "mira-dex-ts";

type Campaign = {
  pool: {
    symbols: string[];
  };
}[];

function getPairsWithRewards(campaigns: Campaign) {
  const pairs = campaigns.map((campaign) => {
    return campaign.pool.symbols.join("/");
  });

  return Array.from(new Set(pairs));
}

const usePoolNameAndMatch = (poolId: PoolId): {isMatching: boolean} => {
  const {symbol: firstSymbol} = useAssetMetadata(poolId[0]?.bits);
  const {symbol: secondSymbol} = useAssetMetadata(poolId[1]?.bits);

  const rewardsData = boostRewards[0].campaigns;
  const poolName = `${firstSymbol}/${secondSymbol}`;
  const pairsWithRewards = getPairsWithRewards(rewardsData);

  const isMatching = pairsWithRewards.some((pair) => pair === poolName);

  return {isMatching};
};

export default usePoolNameAndMatch;
