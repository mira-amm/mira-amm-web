import {useWallet} from "@fuels/react";
import MiraAmm from "mira-dex-ts";
import {useMemo} from "react";

import {ammContractAddress} from "@/src/utils/constants";

const useMiraAmm = () => {
  const { wallet } = useWallet();

  return useMemo(() => {
    if (wallet && wallet.provider) {
      return new MiraAmm({
        wallet,
        provider: wallet?.provider,
        contractAddress: ammContractAddress,
      });
    }
  }, [wallet]);
};

export default useMiraAmm;

