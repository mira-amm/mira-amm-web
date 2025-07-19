"use client";

import {useWallet} from "@fuels/react";
import {MiraAmm} from "mira-dex-ts";
import {useMemo} from "react";
import {DEFAULT_AMM_CONTRACT_ID} from "@/src/utils/constants";

export function useMiraDex() {
  const {wallet} = useWallet();

  return useMemo(() => {
    if (wallet) {
      return new MiraAmm(wallet, DEFAULT_AMM_CONTRACT_ID);
    }
  }, [wallet]);
}
