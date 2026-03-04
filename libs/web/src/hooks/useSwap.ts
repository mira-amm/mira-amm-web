"use client";

import {useCallback} from "react";
import {BN, bn} from "fuels";
import {useWallet} from "@fuels/react";
import {PoolId} from "mira-dex-ts";
import {useMutation} from "@tanstack/react-query";

import type {CurrencyBoxMode, SwapState} from "./useSwapFormState";
import {
  useMiraDex,
  useSwapData,
  useReadonlyMira,
  useMiraDexV2,
  useReadonlyMiraV2,
} from "@/src/hooks";
import {getMaxDeadline} from "@/src/utils/constants";

export function useSwap({
  swapState,
  mode,
  slippage,
  pools,
}: {
  swapState: SwapState;
  mode: CurrencyBoxMode;
  slippage: number;
  pools: (PoolId | BN)[] | undefined;
}) {
  const {wallet} = useWallet();
  const miraDex = useMiraDex();
  const readonlyMira = useReadonlyMira();
  const miraDexV2 = useMiraDexV2();
  const readonlyMiraV2 = useReadonlyMiraV2();
  const swapData = useSwapData(swapState);
  const {sellAssetIdInput, buyAssetIdInput, sellDecimals, buyDecimals} =
    swapData;

  const getTxCost = useCallback(async () => {
    if (!wallet || !pools) {
      return;
    }

    // Determine if this is a V2 swap based on pool ID types
    const hasV2Pools = pools.some((p) => !Array.isArray(p));
    const activeMiraDex = hasV2Pools ? miraDexV2 : miraDex;
    const activeReadonlyMira = hasV2Pools ? readonlyMiraV2 : readonlyMira;

    if (!activeMiraDex || !activeReadonlyMira) {
      return;
    }

    const sellAmount = bn.parseUnits(swapState.sell.amount, sellDecimals);
    const buyAmount = bn.parseUnits(swapState.buy.amount, buyDecimals);

    let tx: any;
    let txCost: BN;

    // Cast pools to the appropriate type based on protocol version
    const typedPools = pools as any[];

    if (mode === "sell") {
      const [_buyAsset, simulatedBuyAmount] =
        await activeReadonlyMira.previewSwapExactInput(
          sellAssetIdInput,
          sellAmount,
          [...typedPools]
        );
      const buyAmountWithSlippage = simulatedBuyAmount
        .mul(bn(10_000).sub(bn(slippage)))
        .div(bn(10_000));

      const {transactionRequest, gasPrice} = await activeMiraDex.swapExactInput(
        sellAmount,
        sellAssetIdInput,
        buyAmountWithSlippage,
        typedPools,
        getMaxDeadline(),
        undefined,
        {reserveGas: 10000, useAssembleTx: true}
      );

      tx = transactionRequest;
      txCost = gasPrice;
    } else {
      const [_sellAsset, simulatedSellAmount] =
        await activeReadonlyMira.previewSwapExactOutput(
          buyAssetIdInput,
          buyAmount,
          [...typedPools]
        );
      const sellAmountWithSlippage = simulatedSellAmount
        .mul(bn(10_000).add(bn(slippage)))
        .div(bn(10_000));
      const {transactionRequest, gasPrice} =
        await activeMiraDex.swapExactOutput(
          buyAmount,
          buyAssetIdInput,
          sellAmountWithSlippage,
          typedPools,
          getMaxDeadline(),
          undefined,
          {reserveGas: 10000, useAssembleTx: true}
        );

      tx = transactionRequest;
      txCost = gasPrice;
    }

    return {tx, txCost};
  }, [
    wallet,
    miraDex,
    miraDexV2,
    readonlyMira,
    readonlyMiraV2,
    swapState.buy.amount,
    sellDecimals,
    swapState.sell.amount,
    buyDecimals,
    slippage,
    mode,
    sellAssetIdInput,
    buyAssetIdInput,
    pools,
  ]);

  const sendTx = useCallback(
    async (inputTx: any) => {
      if (!wallet) {
        return;
      }

      const tx = await wallet.sendTransaction(inputTx);

      const {isStatusPreConfirmationSuccess} =
        await tx.waitForPreConfirmation();

      return {
        isStatusPreConfirmationSuccess,
        waitForResult: tx.waitForResult(),
        id: tx.id,
      };
    },
    [wallet]
  );

  const {
    mutateAsync: fetchTxCost,
    data: txCostData,
    isPending: txCostPending,
    error: txCostError,
    reset: resetTxCost,
  } = useMutation({mutationFn: getTxCost});

  const {
    mutateAsync: triggerSwap,
    data: swapResult,
    isPending: swapPending,
    error: swapError,
    reset: resetSwap,
  } = useMutation({mutationFn: sendTx});

  return {
    fetchTxCost,
    txCostData,
    txCostPending,
    txCostError,
    triggerSwap,
    swapResult,
    swapPending,
    swapError,
    resetTxCost,
    resetSwap,
  };
}
