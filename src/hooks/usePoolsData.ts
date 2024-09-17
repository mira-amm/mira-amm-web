import {useQuery} from "@tanstack/react-query";
import usePoolsIds from "@/src/hooks/usePoolsIds";
import useReadonlyMira from "@/src/hooks/useReadonlyMira";

const usePoolsData = () => {
  const mira = useReadonlyMira();
  const miraExists = Boolean(mira);

  const pools = usePoolsIds();

  const { data, isPending } = useQuery({
    queryKey: ['pools'],
    queryFn: async () => {
      const poolInfoPromises = pools.map(poolId => mira?.poolMetadata(poolId));
      return await Promise.all(poolInfoPromises);
    },
    enabled: miraExists,
  });

  return { data, isPending };
};

export default usePoolsData;
