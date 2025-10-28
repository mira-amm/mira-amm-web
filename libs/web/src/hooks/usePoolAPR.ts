import {useQuery} from "@tanstack/react-query";
import {SQDIndexerUrl} from "@/src/utils/constants";
import request, {gql} from "graphql-request";
import {poolIdToString, UnifiedPoolId} from "@/src/utils/poolTypeDetection";

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

      const tvlUSD = parseFloat(result.poolById.tvlUSD);
      // If TVL is 0 APR should be 0 to avoid infinity
      const apr = tvlUSD > 0 ? (fees24h / tvlUSD) * 365 * 100 : 0;

      const reserve0 = parseFloat(result.poolById.reserve0Decimal) || 0;
      const reserve1 = parseFloat(result.poolById.reserve1Decimal) || 0;

      return {
        apr,
        tvlUSD: result.poolById.tvlUSD,
        reserve0,
        reserve1,
      };
    },
  });

  return {apr: data, isPending};
}
