import {useCallback} from "react";
import {ScriptTransactionRequest} from "fuels";
import {useWallet} from "@fuels/react";
import {useMutation} from "@tanstack/react-query";

import type {CurrencyBoxMode, SwapState} from "@/src/components/common/Swap/Swap";
import useMiraDex from "@/src/hooks/useMiraDex/useMiraDex";
import useSwapData from "@/src/hooks/useAssetPair/useSwapData";
import {DefaultTxParams, MaxDeadline} from "@/src/utils/constants";
import usePoolsIds from "@/src/hooks/usePoolsIds";
import {createPoolId} from "@/src/utils/common";
import {buildPoolId} from "mira-dex-ts";

type Props = {
  swapState: SwapState;
  mode: CurrencyBoxMode;
  slippage: number;
}

const useSwap = ({ swapState, mode, slippage }: Props) => {
  const { wallet } = useWallet();
  const miraDex = useMiraDex();
  const swapData = useSwapData(swapState);
  const pools = usePoolsIds();
  const { sellAssetIdInput, buyAssetIdInput, sellDecimals, buyDecimals } = swapData;

  const getTxCost = useCallback(async () => {
    if (!wallet || !miraDex) {
      return;
    }

    const sellAmount = Number(swapState.sell.amount) * 10 ** sellDecimals;
    const buyAmount = Number(swapState.buy.amount) * 10 ** buyDecimals;

    const buyAmountWithSlippage = buyAmount * (1 - slippage / 100);
    const sellAmountWithSlippage = sellAmount * (1 + slippage / 100);

    const pool = buildPoolId(sellAssetIdInput.bits, buyAssetIdInput.bits, false);

    const tx = mode === 'sell' ?
      await miraDex.swapExactInput(sellAmount, sellAssetIdInput, buyAmountWithSlippage, [pool], MaxDeadline, DefaultTxParams) :
      await miraDex.swapExactOutput(buyAmount, buyAssetIdInput, sellAmountWithSlippage, [pool], MaxDeadline, DefaultTxParams);

    const txCost = await wallet.getTransactionCost(tx);

    return { tx, txCost };
  }, [
    wallet,
    miraDex,
    swapState.buy.amount,
    sellDecimals,
    swapState.sell.amount,
    buyDecimals,
    slippage,
    mode,
    sellAssetIdInput,
    buyAssetIdInput,
    pools
  ]);

  const sendTx = useCallback(async (inputTx: ScriptTransactionRequest) => {
    if (!wallet) {
      return;
    }

    const txCost = await wallet.getTransactionCost(inputTx);
    const fundedTx = await wallet.fund(inputTx, txCost);
    const tx = await wallet.sendTransaction(fundedTx);
    return await tx.waitForResult();
  }, [wallet]);

  const { mutateAsync: fetchTxCost, data: txCostData, isPending: txCostPending} = useMutation({
    mutationFn: getTxCost,
  });

  const { mutateAsync: triggerSwap, data: swapResult, isPending: swapPending } = useMutation({
    mutationFn: sendTx,
  });

  return {
    fetchTxCost,
    txCostData,
    txCostPending,
    triggerSwap,
    swapResult,
    swapPending,
  };
};

export default useSwap;
