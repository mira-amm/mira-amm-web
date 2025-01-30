import {useWallet} from "@fuels/react";
import {MiraAmm} from "mira-dex-ts";
import {useMemo} from "react";

import useContractId from "../useContractId";

const useMiraDex = () => {
  const {wallet} = useWallet();
  const contractId = useContractId();

  return useMemo(() => {
    if (wallet && contractId) {
      return new MiraAmm(wallet, contractId);
    }
  }, [contractId, wallet]);
};

export default useMiraDex;
