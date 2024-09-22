import {useFuel, useIsConnected, useWallet} from "@fuels/react";
import {useQuery} from "@tanstack/react-query";
import {ValidNetwork} from "@/src/utils/constants";

const useCheckActiveNetwork = () => {
  const { fuel } = useFuel();
  const { isConnected } = useIsConnected();

  const { data } = useQuery({
    queryKey: ['activeNetwork'],
    queryFn: () => fuel.currentNetwork(),
    enabled: isConnected,
  });

  return Boolean(data?.url.includes(ValidNetwork));
};

export default useCheckActiveNetwork;
