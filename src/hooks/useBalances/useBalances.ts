import {useBalance, useWallet} from "@fuels/react";
import {useQuery} from "@tanstack/react-query";
import {useEffect, useMemo} from "react";
import useStableWallet from "@/src/hooks/useStableWallet";

const useBalances = () => {
  const { wallet } = useWallet();

  const { data, isPending, refetch } = useQuery({
    queryKey: ['balances', wallet?.address],
    queryFn: async () => {
      if (!wallet) {
        return null;
      }

      return wallet.getBalances();
    },
    enabled: Boolean(wallet),
  });

  return { balances: data?.balances, isPending, refetch };
};

export default useBalances;
