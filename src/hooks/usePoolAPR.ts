import {useQuery} from "@tanstack/react-query";
import {PoolId} from "mira-dex-ts";
import {createPoolIdString} from "@/src/utils/common";
import {PoolsData} from "@/src/hooks/usePoolsData";
import {ApiBaseUrl} from "@/src/utils/constants";

const usePoolAPR = (pool: PoolId) => {
  const poolIdString = createPoolIdString(pool);

  const { data, isPending } = useQuery({
    queryKey: ['poolAPR', poolIdString],
    queryFn: async () => {
      const poolsDataResponse = await fetch(`${ApiBaseUrl}/pools`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          'volume_hours': 24,
          'apr_days': 1,
          "pool_id": poolIdString,
        }),
      });

      const poolsData: PoolsData = await poolsDataResponse.json();
      return poolsData.pools[0].details.apr;
    },
  });

  return { apr: data, isPending };
};

export default usePoolAPR;
