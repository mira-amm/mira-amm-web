import {useWallet} from "@fuels/react";
import MiraAmm from "mira-dex-ts";
import {useMemo} from "react";
import useProvider from "@/src/hooks/useProvider/useProvider";

import {ammContractAddress} from "@/src/utils/constants";

const useMiraAmm = () => {
  const { wallet } = useWallet();
  const provider= useProvider();

  return useMemo(() => {
    if (provider) {
      return new MiraAmm({
        wallet: wallet ?? undefined,
        provider,
        contractAddress: ammContractAddress,
      });
    }
  }, [wallet, provider]);
};

export default useMiraAmm;

