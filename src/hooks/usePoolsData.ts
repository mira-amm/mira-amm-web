import {useQuery} from "@tanstack/react-query";
import usePoolsIds from "@/src/hooks/usePoolsIds";
import {CoinName} from "@/src/utils/coinsConfig";
import {arePoolIdsEqual, createPoolIdFromIdString} from "@/src/utils/common";
import {ApiBaseUrl} from "@/src/utils/constants";

export type PoolData = {
  id: string;
  reserve_0: string;
  reserve_1: string;
  details: {
    asset_0_symbol: CoinName;
    asset_1_symbol: CoinName;
    apr: string;
    volume: string;
    tvl: string;
  };
  swap_count: number;
};

export type PoolsData = {
  pools: PoolData[];
  sync_timestamp: number;
};

const usePoolsData = () => {
  const pools = usePoolsIds();

  const { data, isPending } = useQuery({
    queryKey: ['pools'],
    queryFn: async () => {
      const poolsDataResponse = await fetch(`${ApiBaseUrl}/pools`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          'volume_hours': 24,
          'apr_days': 7,
        }),
      });

      const poolsData: PoolsData = await poolsDataResponse.json();
      return poolsData.pools.filter(poolData => {
        const poolId = createPoolIdFromIdString(poolData.id);
        return pools.some(predefinedPoolId => arePoolIdsEqual(predefinedPoolId, poolId));
      });
    },
  });

  return { data, isPending };
};

export default usePoolsData;
