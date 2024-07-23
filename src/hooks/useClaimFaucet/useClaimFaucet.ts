import {Faucet} from 'mira-faucet-ts';
import {DefaultTxParams, FaucetAssetId, FaucetContractAddress} from "@/src/utils/constants";
import {useWallet} from "@fuels/react";
import {useMemo} from "react";
import {useMutation} from "@tanstack/react-query";

const useClaimFaucet = () => {
  const { wallet } = useWallet();

  const faucetSdk = useMemo(() => {
    if (wallet) {
      return new Faucet({
        wallet,
        contractAddress: FaucetContractAddress
      });
    }
  }, [wallet]);

  const { data, mutateAsync, isPending } = useMutation({
    mutationFn: async () => faucetSdk?.faucetTokens({ bits: FaucetAssetId }, 1_000_000_000, DefaultTxParams),
  });

  return { data, mutateAsync, isPending };
};

export default useClaimFaucet;
