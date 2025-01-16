import {useQuery} from "@tanstack/react-query";
import useReadonlyMira from "@/src/hooks/useReadonlyMira";
import useBalances from "@/src/hooks/useBalances/useBalances";
import request, {gql} from "graphql-request";
import {SQDIndexerUrl} from "../utils/constants";
import {createPoolIdFromIdString} from "../utils/common";
import {Asset, PoolId} from "mira-dex-ts";

export interface Position {
  poolId: PoolId;
  lpAssetId: string;
  isStable: boolean;
  token0Position: Asset;
  token1Position: Asset;
}

const usePositions = (): {data: Position[] | undefined; isLoading: boolean} => {
  const mira = useReadonlyMira();
  const {balances} = useBalances();

  const miraExists = Boolean(mira);

  const {data, isLoading} = useQuery({
    queryKey: ["positions", balances],
    queryFn: async () => {
      const assetIds = balances?.map((balance) => balance.assetId);

      const query = gql`
        query MyQuery {
          pools(where: {
            lpToken: {id_in: [${assetIds!.map((assetId) => `"${assetId}"`).join(", ")}]}
          }) {
            id
            lpToken {
              id
            }
            asset0 {
              id
            }
            asset1 {
              id
            }
            isStable
          }
        }
      `;

      const result = await request<{pools: any[]}>({
        url: SQDIndexerUrl,
        document: query,
      });

      const pools = await Promise.all(
        result.pools.map(async (pool: any) => {
          const poolId = createPoolIdFromIdString(pool.id);
          const lpBalance = balances!.find(
            (balance) => balance.assetId === pool.lpToken.id,
          );
          const [token0Position, token1Position] =
            await mira!.getLiquidityPosition(
              poolId,
              lpBalance!.amount.toString(),
            );

          return {
            poolId,
            lpAssetId: pool.lpToken.id,
            isStable: pool.isStable,
            token0Position,
            token1Position,
          };
        }),
      );

      return pools;
    },
    enabled: miraExists && !!balances,
  });

  return {data, isLoading};
};

export default usePositions;
