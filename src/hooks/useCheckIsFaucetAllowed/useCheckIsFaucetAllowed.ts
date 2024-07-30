import {useQuery} from "@tanstack/react-query";
import useFaucetSDK from "@/src/hooks/useFaucetSDK/useFaucetSDK";
import {AddressInput, IdentityInput} from "mira-faucet-ts/src/typegen/token-factory/TokenFactoryAbi";
import {coinsConfig} from "@/src/utils/coinsConfig";
import {AssetId, Bech32Address, toB256} from "fuels";
import {useCallback} from "react";

const useCheckIsFaucetAllowed = (account: string | null) => {
  const faucetSDK = useFaucetSDK();
  const assetIdB256 = coinsConfig.get('MIMIC')?.assetId!;

  const queryFn = useCallback(async () => {
    if (!faucetSDK || !account) {
      return null;
    }

    const assetId: AssetId = {
      bits: assetIdB256,
    };
    const addressInput: AddressInput = {
      bits: toB256(account as Bech32Address)
    };

    const identityInput: IdentityInput = {
      Address: addressInput,
    };

    return faucetSDK.isAllowedToFaucet(assetId, identityInput);
  }, [faucetSDK, account, assetIdB256]);

  const { data } = useQuery({
    queryKey: ['isFaucetAllowed', account, assetIdB256],
    queryFn,
    enabled: Boolean(faucetSDK) && Boolean(account),
  });

  return { data };
};

export default useCheckIsFaucetAllowed;
