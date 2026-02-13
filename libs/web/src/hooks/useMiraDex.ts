"use client";

import {useWallet} from "@fuels/react";
import {MiraAmm} from "mira-dex-ts";
import {useMemo} from "react";
import {DEFAULT_AMM_CONTRACT_ID, SQDIndexerUrl} from "@/src/utils/constants";

export function useMiraDex() {
  const {wallet} = useWallet();

  return useMemo(() => {
    if (wallet && DEFAULT_AMM_CONTRACT_ID) {
      const isLocal = SQDIndexerUrl.includes("127.0.0.1");
      return new MiraAmm(wallet, {
        contractId: DEFAULT_AMM_CONTRACT_ID,
        useScriptLoader: !isLocal,
      });
    }
  }, [wallet]);
}
