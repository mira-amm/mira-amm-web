import {useWallet} from "@fuels/react";
import {useMemo} from "react";
import {Faucet} from "mira-faucet-ts";
import {FaucetContractAddress} from "@/src/utils/constants";

const useFaucetSDK = () => {
  const { wallet } = useWallet();

  return useMemo(() => {
    if (wallet) {
      return new Faucet({
        wallet,
        contractAddress: FaucetContractAddress
      });
    }
  }, [wallet]);
};

export default useFaucetSDK;
