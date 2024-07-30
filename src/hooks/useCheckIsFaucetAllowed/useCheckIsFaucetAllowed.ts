import {useMutation, useQuery} from "@tanstack/react-query";
import useFaucetSDK from "@/src/hooks/useFaucetSDK/useFaucetSDK";
import {AddressInput, ContractIdInput, IdentityInput} from "mira-faucet-ts/src/typegen/token-factory/TokenFactoryAbi";
import {coinsConfig} from "@/src/utils/coinsConfig";
import {useAccount} from "@fuels/react";
import {FaucetContractAddress} from "@/src/utils/constants";
import {Address, AssetId, Bech32Address, BN, toB256} from "fuels";
import {useCallback} from "react";

const useCheckIsFaucetAllowed = (account: string | null) => {
  const faucetSDK = useFaucetSDK();
  // const { account } = useAccount();
  // console.log(account);
  // console.log(faucetSDK);
  const assetIdB256 = coinsConfig.get('MIMIC')?.assetId!;

  const queryFn = useCallback(async () => {
    // console.log(1);
    if (!faucetSDK || !account) {
      // console.log(2);
      return null;
    }
    // console.log(3);

    const assetId: AssetId = {
      bits: assetIdB256,
    };
    const addressInput: AddressInput = {
      bits: toB256(account as Bech32Address)
    };
    // const contractIdInput: ContractIdInput = {
    //   bits: FaucetContractAddress,
    // };

    const identityInput: IdentityInput = {
      Address: addressInput,
    };

    return faucetSDK.isAllowedToFaucet(assetId, identityInput);
  }, [faucetSDK, account, assetIdB256]);

  // const { data, mutateAsync } = useMutation({
  //   mutationFn: queryFn,
  // });

  const { data } = useQuery({
    queryKey: ['isFaucetAllowed', account, assetIdB256],
    queryFn,
    enabled: Boolean(faucetSDK) && Boolean(account),
  });

  return { data };
};

export default useCheckIsFaucetAllowed;
