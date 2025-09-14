"use client";

import React, {createContext, useContext, useMemo} from "react";
import {
  MiraAmm,
  MiraAmmV2,
  ReadonlyMiraAmm,
  ReadonlyMiraAmmV2,
} from "mira-dex-ts";
import type {
  IMiraAmm,
  IMiraAmmV2,
  IReadonlyMiraAmm,
  IReadonlyMiraAmmV2,
} from "mira-dex-ts";
import {useWallet} from "@fuels/react";
import {useProvider} from "@/src/hooks/useProvider";
import {DEFAULT_AMM_CONTRACT_ID} from "@/src/utils/constants";

interface MiraSDKContextType {
  mira?: IMiraAmm;
  miraV2?: IMiraAmmV2;
  readonlyMira?: IReadonlyMiraAmm;
  readonlyMiraV2?: IReadonlyMiraAmmV2;
}

const MiraSDKContext = createContext<MiraSDKContextType | undefined>(undefined);

interface MiraSDKProviderProps {
  children: React.ReactNode;
  mira?: IMiraAmm;
  miraV2?: IMiraAmmV2;
  readonlyMira?: IReadonlyMiraAmm;
  readonlyMiraV2?: IReadonlyMiraAmmV2;
  contractId?: string;
}

export function MiraSDKProvider({
  children,
  mira: injectedMira,
  miraV2: injectedMiraV2,
  readonlyMira: injectedReadonlyMira,
  readonlyMiraV2: injectedReadonlyMiraV2,
  contractId = DEFAULT_AMM_CONTRACT_ID,
}: MiraSDKProviderProps) {
  const {wallet} = useWallet();
  const provider = useProvider();

  const value = useMemo(() => {
    const mira =
      injectedMira || (wallet ? new MiraAmm(wallet, contractId) : undefined);
    const miraV2 =
      injectedMiraV2 ||
      (wallet ? new MiraAmmV2(wallet, contractId) : undefined);
    const readonlyMira =
      injectedReadonlyMira ||
      (provider ? new ReadonlyMiraAmm(provider, contractId) : undefined);
    const readonlyMiraV2 =
      injectedReadonlyMiraV2 ||
      (provider ? new ReadonlyMiraAmmV2(provider, contractId) : undefined);

    return {
      mira,
      miraV2,
      readonlyMira,
      readonlyMiraV2,
    };
  }, [
    wallet,
    provider,
    injectedMira,
    injectedMiraV2,
    injectedReadonlyMira,
    injectedReadonlyMiraV2,
    contractId,
  ]);

  return (
    <MiraSDKContext.Provider value={value}>{children}</MiraSDKContext.Provider>
  );
}

export function useMiraSDK() {
  const context = useContext(MiraSDKContext);
  if (context === undefined) {
    throw new Error("useMiraSDK must be used within a MiraSDKProvider");
  }
  return context;
}

export function useMira() {
  const {mira} = useMiraSDK();
  return mira;
}

export function useMiraV2() {
  const {miraV2} = useMiraSDK();
  return miraV2;
}

export function useReadonlyMira() {
  const {readonlyMira} = useMiraSDK();
  return readonlyMira;
}

export function useReadonlyMiraV2() {
  const {readonlyMiraV2} = useMiraSDK();
  return readonlyMiraV2;
}
