import {useWallet} from "@fuels/react";
import {MiraAmm} from "mira-dex-ts";
import {useMemo} from "react";

const useMiraDex = () => {
  const { wallet } = useWallet();

  return useMemo(() => {
    if (wallet) {
      return new MiraAmm(
        wallet,
      );
    }
  }, [wallet]);
};

export default useMiraDex;
