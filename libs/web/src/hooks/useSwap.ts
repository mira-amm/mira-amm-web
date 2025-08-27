"use client";

import { useCallback } from "react";
import { BN, bn, ScriptTransactionRequest } from "fuels";
import { useWallet } from "@fuels/react";
import { PoolId } from "mira-dex-ts";
import { useMutation } from "@tanstack/react-query";

import type {
  CurrencyBoxMode,
  SwapState,
} from "@/src/components/common/Swap/Swap";
import {
  useMiraDex,
  useSwapData,
  useReadonlyMira,
  useMiraDexV2,
  useReadonlyMiraV2,
} from "@/src/hooks";
import { MaxDeadline } from "@/src/utils/constants";
import { type PoolTypeOption } from "@/src/components/common/PoolTypeToggle";

export function useSwap({
  swapState,
  mode,
  slippage,
  pools,
  poolType = "v1",
}: {
  swapState: SwapState;
  mode: CurrencyBoxMode;
  slippage: number;
  pools: PoolId[] | undefined;
  poolType?: PoolTypeOption;
}) {
  const { wallet } = useWallet();
  const miraDex = useMiraDex();
  const readonlyMira = useReadonlyMira();
  const miraDexV2 = useMiraDexV2();
  const readonlyMiraV2 = useReadonlyMiraV2();
  const swapData = useSwapData(swapState);
  const { sellAssetIdInput, buyAssetIdInput, sellDecimals, buyDecimals } =
    swapData;

  const getTxCost = useCallback(async () => {
    if (!wallet || !pools) {
      return;
    }

    // Determine which SDK to use based on pool type
    const isV2 = poolType === "v2";
    const activeMiraDex = isV2 ? miraDexV2 : miraDex;
    const activeReadonlyMira = isV2 ? readonlyMiraV2 : readonlyMira;

    if (!activeMiraDex || !activeReadonlyMira) {
      return;
    }

    const sellAmount = bn.parseUnits(swapState.sell.amount, sellDecimals);
    const buyAmount = bn.parseUnits(swapState.buy.amount, buyDecimals);

    let tx: ScriptTransactionRequest;
    let txCost: BN;

    if (mode === "sell") {
      const [_buyAsset, simulatedBuyAmount] =
        await activeReadonlyMira.previewSwapExactInput(
          sellAssetIdInput,
          sellAmount,
          [...pools]
        );
      const buyAmountWithSlippage = simulatedBuyAmount
        .mul(bn(10_000).sub(bn(slippage)))
        .div(bn(10_000));

      const { transactionRequest, gasPrice } = await activeMiraDex.swapExactInput(
        sellAmount,
        sellAssetIdInput,
        buyAmountWithSlippage,
        pools,
        MaxDeadline,
        undefined,
        {useAssembleTx: true, reserveGas: 10000}
      );

      tx = transactionRequest;
      txCost = gasPrice;
    } else {
      const [_sellAsset, simulatedSellAmount] =
        await activeReadonlyMira.previewSwapExactOutput(
          buyAssetIdInput,
          buyAmount,
          [...pools]
        );
      const sellAmountWithSlippage = simulatedSellAmount
        .mul(bn(10_000).add(bn(slippage)))
        .div(bn(10_000));
      const { transactionRequest, gasPrice } =
        await activeMiraDex.swapExactOutput(
          buyAmount,
          buyAssetIdInput,
          sellAmountWithSlippage,
          pools,
          MaxDeadline,
          { useAssembleTx: true }
        );

      tx = transactionRequest;
      txCost = gasPrice;
    }

    return { tx, txCost };
  }, [
    wallet,
    miraDex,
    miraDexV2,
    readonlyMira,
    readonlyMiraV2,
    poolType,
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

      const { isStatusPreConfirmationSuccess } =
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
  } = useMutation({ mutationFn: getTxCost });

  const {
    mutateAsync: triggerSwap,
    data: swapResult,
    isPending: swapPending,
    error: swapError,
    reset: resetSwap,
  } = useMutation({ mutationFn: sendTx });

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
