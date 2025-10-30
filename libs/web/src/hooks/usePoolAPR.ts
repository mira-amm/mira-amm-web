import {useQuery} from "@tanstack/react-query";
import {SQDIndexerUrl} from "@/src/utils/constants";
import request, {gql} from "graphql-request";
import {poolIdToString, UnifiedPoolId} from "@/src/utils/poolTypeDetection";
import {
  calculatePoolTVL,
  calculatePoolAPR,
} from "@/src/utils/poolTvlCalculation";

export function usePoolAPR(pool: UnifiedPoolId) {
  const poolIdString = poolIdToString(pool);

  const {data, isPending} = useQuery({
    queryKey: ["poolAPR", poolIdString],
    queryFn: async () => {
      const time24HoursAgo = Math.floor(Date.now() / 1000) - 24 * 60 * 60;
      const query = gql`
        query MyQuery {
          poolById(id: "${poolIdString}") {
            snapshots(where: {timestamp_gt: ${time24HoursAgo}}, orderBy: timestamp_ASC) {
              feesUSD
            }
            tvlUSD
            reserve0Decimal
            reserve1Decimal
            protocolVersion
            asset0 {
              price
            }
            asset1 {
              price
            }
          }
        }
      `;

      const result = await request<any>({
        url: SQDIndexerUrl,
        document: query,
      });
      const fees24h = result.poolById.snapshots.reduce(
        (acc: number, snapshot: any) => acc + parseFloat(snapshot.feesUSD),
        0
      );

      const reserve0 = parseFloat(result.poolById.reserve0Decimal) || 0;
      const reserve1 = parseFloat(result.poolById.reserve1Decimal) || 0;

      const tvlUSD = calculatePoolTVL({
        reserve0Decimal: result.poolById.reserve0Decimal,
        reserve1Decimal: result.poolById.reserve1Decimal,
        price0: result.poolById.asset0.price,
        price1: result.poolById.asset1.price,
        protocolVersion: result.poolById.protocolVersion,
        indexerTvlUSD: result.poolById.tvlUSD,
      });

      const apr = calculatePoolAPR(fees24h, tvlUSD);

      return {
        apr,
        tvlUSD,
        reserve0,
        reserve1,
      };
    },
  });

  return {apr: data, isPending};
}
