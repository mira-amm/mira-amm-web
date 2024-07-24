import { useWallet } from "@fuels/react";
import {useQuery} from "@tanstack/react-query";

const useBalances = () => {
  const { wallet } = useWallet();

  const { data, isPending } = useQuery({
    queryKey: ['balances', wallet?.address],
    queryFn: async () => {
      if (!wallet) {
        return null;
      }

      return wallet.getBalances();
    },
    enabled: Boolean(wallet),
  });

  return { balances: data?.balances, isPending };
};

export default useBalances;
