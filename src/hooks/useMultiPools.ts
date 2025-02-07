import {PoolId} from "mira-dex-ts";
import {CoinData} from "../utils/coinsConfig";
import {useQuery} from "@tanstack/react-query";
import request, {gql} from "graphql-request";
import {SQDIndexerUrl} from "../utils/constants";

type PoolReserveData = {
  reserve0: string;
  reserve1: string;
};

type Pool = {
  assetA: CoinData;
  assetB: CoinData;
  poolId: PoolId;
} & PoolReserveData;

const useGetPools = (poolKeys: [CoinData, CoinData, PoolId, boolean][]) => {
  const poolQueries = poolKeys
    .map(([, , [assetA, assetB], stable], idx) => {
      const poolId = `${assetA.bits}-${assetB.bits}-${stable}`;
      const alias = String.fromCharCode(97 + idx); // 'a', 'b', 'c' ....
      return `${alias}: poolById(id: "${poolId}") {
            ...PoolFragment
          }`;
    })
    .join("\n");

  const gqlQuery = gql`
    query MultiPoolReserve {
        ${poolQueries}
    }
    fragment PoolFragment on Pool {
        reserve0
        reserve1
    }
`;

  const {isLoading, data, isRefetching, refetch} = useQuery<
    Record<string, PoolReserveData | null>
  >({
    queryKey: ["routable-pools", poolKeys.length],
    queryFn: () =>
      request({
        url: SQDIndexerUrl,
        document: gqlQuery,
      }),
  });
};

export default useGetPools;
