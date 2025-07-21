"use client";

import {useCallback} from "react";
import {BN, bn, ScriptTransactionRequest} from "fuels";
import {useWallet} from "@fuels/react";
import {PoolId} from "mira-dex-ts";
import {useMutation} from "@tanstack/react-query";

import type {
  CurrencyBoxMode,
  SwapState,
} from "@/src/components/common/Swap/Swap";
import {useMiraDex, useSwapData, useReadonlyMira} from "@/src/hooks";
import {DefaultTxParams, MaxDeadline} from "@/src/utils/constants";

export function useSwap({
  swapState,
  mode,
  slippage,
  pools,
}: {
  swapState: SwapState;
  mode: CurrencyBoxMode;
  slippage: number;
  pools: PoolId[] | undefined;
}) {
  const {wallet} = useWallet();
  const miraDex = useMiraDex();
  const readonlyMira = useReadonlyMira();
  const swapData = useSwapData(swapState);
  const {sellAssetIdInput, buyAssetIdInput, sellDecimals, buyDecimals} =
    swapData;

  const getTxCost = useCallback(async () => {
    if (!wallet || !miraDex || !pools || !readonlyMira) {
      return;
    }

    const sellAmount = bn.parseUnits(swapState.sell.amount, sellDecimals);
    const buyAmount = bn.parseUnits(swapState.buy.amount, buyDecimals);

    let tx: ScriptTransactionRequest;
    let txCost: BN;

    if (mode === "sell") {
      const [_buyAsset, simulatedBuyAmount] =
        await readonlyMira.previewSwapExactInput(sellAssetIdInput, sellAmount, [
          ...pools,
        ]);
      const buyAmountWithSlippage = simulatedBuyAmount
        .mul(bn(10_000).sub(bn(slippage)))
        .div(bn(10_000));

      const {transactionRequest, gasPrice} = await miraDex.swapExactInput(
        sellAmount,
        sellAssetIdInput,
        buyAmountWithSlippage,
        pools,
        MaxDeadline,
        DefaultTxParams,
        {useAssembleTx: true}
      );

      tx = transactionRequest;
      txCost = gasPrice;
    } else {
      const [_sellAsset, simulatedSellAmount] =
        await readonlyMira.previewSwapExactOutput(buyAssetIdInput, buyAmount, [
          ...pools,
        ]);
      const sellAmountWithSlippage = simulatedSellAmount
        .mul(bn(10_000).add(bn(slippage)))
        .div(bn(10_000));
      const {transactionRequest, gasPrice} = await miraDex.swapExactOutput(
        buyAmount,
        buyAssetIdInput,
        sellAmountWithSlippage,
        pools,
        MaxDeadline,
        DefaultTxParams,
        {useAssembleTx: true}
      );

      tx = transactionRequest;
      txCost = gasPrice;
    }

    return {tx, txCost};
  }, [
    wallet,
    miraDex,
    readonlyMira,
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
    async (inputTx: ScriptTransactionRequest) => {
      if (!wallet) {
        return;
      }

      const tx = await wallet.sendTransaction(inputTx);

      await tx.waitForPreConfirmation();

      return await tx.waitForResult();
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
