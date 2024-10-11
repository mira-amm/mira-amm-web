import {useQuery} from "@tanstack/react-query";
import useFaucetSDK from "@/src/hooks/useFaucetSDK/useFaucetSDK";
import {AddressInput, IdentityInput} from "mira-faucet-ts/src/typegen/token-factory/TokenFactory";
import {coinsConfig} from "@/src/utils/coinsConfig";
import {AssetId, Bech32Address, toB256} from "fuels";
import {useCallback} from "react";

const useCheckIsFaucetAllowed = (account: string | null) => {
  const faucetSDK = useFaucetSDK();

  const queryFn = useCallback(async () => {
    if (!faucetSDK || !account) {
      return null;
    }

    const addressInput: AddressInput = {
      bits: toB256(account as Bech32Address)
    };

    const identityInput: IdentityInput = {
      Address: addressInput,
    };

    return false;
  }, [faucetSDK, account]);

  const { data, refetch } = useQuery({
    queryKey: ['isFaucetAllowed', account],
    queryFn,
    enabled: Boolean(faucetSDK) && Boolean(account),
  });

  return { data, refetch };
};

export default useCheckIsFaucetAllowed;
