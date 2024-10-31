import {useQuery} from "@tanstack/react-query";
import {CoinName} from "@/src/utils/coinsConfig";
import {ApiBaseUrl, IndexerUrl, SQDIndexerUrl} from "@/src/utils/constants";
import {createPoolIdFromIdString, isPoolIdValid} from "@/src/utils/common";
import request, { gql } from "graphql-request";

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

export const usePoolsData = (): { data: PoolData[] | undefined, isLoading: boolean } => {
  const query = gql`
    query PoolQuery {
      pools {
        id
        isStable
        lpToken {
          symbol
          name
        }
        asset1 {
          symbol
          decimals
        }
        asset0 {
          symbol
          decimals
        }
      }
    }
  `;

  const { data, isLoading } = useQuery<any>({
    queryKey: ['pools'],
    queryFn: () => request({
      url: SQDIndexerUrl,
      document: query,
    }),
    // enabled: shouldFetch,
  });

  const dataTransformed = data?.pools.map((pool: any): PoolData => {
    return {
      id: pool.id,
      reserve_0: '0',
      reserve_1: '0',
      details: {
        asset_0_symbol: pool.asset0.symbol as CoinName,
        asset_1_symbol: pool.asset1.symbol as CoinName,
        apr: null,
        volume: '0',
        tvl: '0',
      },
      swap_count: 0,
      create_time: 0,
    };
  });

  return { data: dataTransformed, isLoading };
};

export default usePoolsData;
