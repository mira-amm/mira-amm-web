import {useQuery} from "@tanstack/react-query";
import {CoinName, verifiedAssetIds} from "@/src/utils/coinsConfig";
import {ApiBaseUrl} from "@/src/utils/constants";

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
};

export type PoolsData = {
  pools: PoolData[];
  sync_timestamp: number;
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
      return poolsData.pools
        .filter(poolData => {
          const idParts = poolData.id.split('_');
          if (idParts.length !== 3) {
            return false;
          }
          const [asset0, asset1, _] = idParts;
          return verifiedAssetIds.has(asset0) && verifiedAssetIds.has(asset1);
        });
    },
  });

  return { data, isLoading };
};

export default usePoolsData;
