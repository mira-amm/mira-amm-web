import {useBalance, useWallet} from "@fuels/react";
import {useQuery} from "@tanstack/react-query";
import {useEffect, useMemo} from "react";
import useStableWallet from "@/src/hooks/useStableWallet";

const useBalances = () => {
  const { wallet } = useWallet();
  // const wallet = useStableWallet();
  // const {} = useBalance();

  // const walletAddress = useMemo(() => wallet?.address, [wallet]);

  // useEffect(() => {
  //   console.log("Wallet or wallet address changed:", wallet, walletAddress);
  // }, [wallet, walletAddress]);

  const { data, isPending, refetch } = useQuery({
    queryKey: ['balances', wallet?.address],
    queryFn: async () => {
      if (!wallet) {
        return null;
      }

      return wallet.getBalances();
    },
    enabled: Boolean(wallet),
    // staleTime: Infinity, // Prevents automatic refetching
    // cacheTime: Infinity, // Keeps the data in cache indefinitely
  });

  // useEffect(() => {
  //   console.log("Query data updated:", data);
  // }, [data]);

  return { balances: data?.balances, isPending, refetch };
};

export default useBalances;
