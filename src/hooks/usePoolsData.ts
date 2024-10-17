import {useQuery} from "@tanstack/react-query";
import {CoinName} from "@/src/utils/coinsConfig";
import {ApiBaseUrl} from "@/src/utils/constants";
import {createPoolIdFromIdString, isPoolIdValid} from "@/src/utils/common";

export type PoolData = {
  id: string;
  reserve_0: string;
  reserve_1: string;
  details: {
    asset_0_symbol: CoinName;
    asset_1_symbol: CoinName;
    apr: string | null;
    volume: string;
    tvl: string;
  };
  swap_count: number;
  create_time: number;
};

export type PoolsData = {
  pools: PoolData[];
};

const usePoolsData = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['pools'],
    queryFn: async () => {
      const poolsDataResponse = await fetch(`${ApiBaseUrl}/pools`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          'volume_hours': 24,
          'apr_days': 1,
        }),
      });

      const poolsData: PoolsData = await poolsDataResponse.json();
      return poolsData.pools.filter(poolData => {
        const poolId = createPoolIdFromIdString(poolData.id);
        return (
          poolData.details !== null && isPoolIdValid(poolId)
        );
      });
    },
  });

  return { data, isLoading };
};

export default usePoolsData;
