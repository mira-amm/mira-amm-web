import {useWallet} from "@fuels/react";
import {useMutation} from "@tanstack/react-query";
import {useCallback, useMemo} from "react";
import {AssetIdInput} from "mira-dex-ts/src/typegen/amm-contract/AmmContractAbi";
import {Faucet} from 'mira-faucet-ts';

import {DefaultTxParams, FaucetContractAddress} from "@/src/utils/constants";
import {coinsConfig} from "@/src/utils/coinsConfig";

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

  const mutationFn = useCallback(async () => {
    if (!faucetSdk) {
      return;
    }

    const mimicAssetId = coinsConfig.get('MIMIC')?.assetId!;
    const mimicDecimals = coinsConfig.get('MIMIC')?.decimals!;

    const mimicAssetIdInput: AssetIdInput = {
      bits: mimicAssetId,
    };

    const mimicAmount = 100 * 10 ** mimicDecimals;

    return faucetSdk.faucetTokens(mimicAssetIdInput, mimicAmount, DefaultTxParams);
  }, [faucetSdk]);

  const { data, mutateAsync, isPending } = useMutation({
    mutationFn,
  });

  return { data, mutateAsync, isPending };
};

export default useClaimFaucet;
