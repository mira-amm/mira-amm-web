import {useMutation} from "@tanstack/react-query";
import {useCallback} from "react";
import {AssetIdInput} from "mira-dex-ts/src/typegen/amm-contract/AmmContractAbi";

import {DefaultTxParams} from "@/src/utils/constants";
import {coinsConfig} from "@/src/utils/coinsConfig";
import useFaucetSDK from "@/src/hooks/useFaucetSDK/useFaucetSDK";

const useClaimFaucet = () => {
  const faucetSDK = useFaucetSDK();

  const mutationFn = useCallback(async () => {
    if (!faucetSDK) {
      return;
    }

    const mimicAssetId = coinsConfig.get('MIMIC')?.assetId!;
    const mimicDecimals = coinsConfig.get('MIMIC')?.decimals!;

    const mimicAssetIdInput: AssetIdInput = {
      bits: mimicAssetId,
    };

    const mimicAmount = 10 * 10 ** mimicDecimals;

    return faucetSDK.faucetTokens(mimicAssetIdInput, mimicAmount, DefaultTxParams);
  }, [faucetSDK]);

  const { data, mutateAsync, isPending } = useMutation({
    mutationFn,
  });

  return { data, mutateAsync, isPending };
};

export default useClaimFaucet;
