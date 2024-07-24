import {useWallet} from "@fuels/react";
import MiraDex from "mira-dex-ts";
import {useMemo} from "react";
import useProvider from "@/src/hooks/useProvider/useProvider";

import {DexContractAddress} from "@/src/utils/constants";

const useMiraDex = () => {
  const { wallet } = useWallet();
  const provider= useProvider();

  return useMemo(() => {
    if (provider) {
      return new MiraDex({
        wallet: wallet ?? undefined,
        provider,
        contractAddress: DexContractAddress,
      });
    }
  }, [wallet, provider]);
};

export default useMiraDex;

