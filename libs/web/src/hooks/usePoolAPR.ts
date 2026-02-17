import {useQuery} from "@tanstack/react-query";
import {PoolId} from "mira-dex-ts";
import {createPoolIdString} from "@/src/utils/common";
import {SQDIndexerUrl} from "@/src/utils/constants";
import request, {gql} from "graphql-request";

interface PoolAPRResponse {
  poolById: {
    snapshots: {feesUSD: string}[];
    tvlUSD: string;
    reserve0Decimal: string;
    reserve1Decimal: string;
  };
}

export function usePoolAPR(pool: PoolId) {
  const poolIdString = createPoolIdString(pool);

  const {data, isPending} = useQuery({
    queryKey: ["poolAPR", poolIdString],
    queryFn: async () => {
      const time24HoursAgo = Math.floor(Date.now() / 1000) - 24 * 60 * 60;
      const query = gql`
        query MyQuery {
          poolById(id: "${createPoolIdString(pool)}") {
            snapshots(where: {timestamp_gt: ${time24HoursAgo}}, orderBy: timestamp_ASC) {
              feesUSD
            }
            tvlUSD
            reserve0Decimal
            reserve1Decimal
          }
        }
      `;

      const result = await request<PoolAPRResponse>({
        url: SQDIndexerUrl,
        document: query,
      });
      const fees24h = result.poolById.snapshots.reduce(
        (acc: number, snapshot: {feesUSD: string}) =>
          acc + parseFloat(snapshot.feesUSD),
        0
      );
      const apr = (fees24h / parseFloat(result.poolById.tvlUSD)) * 365 * 100;

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
