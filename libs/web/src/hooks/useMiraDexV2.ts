"use client";

import {useWallet} from "@fuels/react";
import {MiraAmmV2} from "mira-dex-ts";
import {useMemo} from "react";
import {DEFAULT_AMM_V2_CONTRACT_ID} from "@/src/utils/constants";

export function useMiraDexV2() {
  const {wallet} = useWallet();

  return useMemo(() => {
    if (wallet && DEFAULT_AMM_V2_CONTRACT_ID) {
      return new MiraAmmV2(wallet, DEFAULT_AMM_V2_CONTRACT_ID);
    }
  }, [wallet]);
}
