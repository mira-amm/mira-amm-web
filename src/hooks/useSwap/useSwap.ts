import {useCallback} from "react";
import {ScriptTransactionRequest} from "fuels";
import {useWallet} from "@fuels/react";
import {useMutation} from "@tanstack/react-query";

import type {CurrencyBoxMode, SwapState} from "@/src/components/common/Swap/Swap";
import useMiraDex from "@/src/hooks/useMiraDex/useMiraDex";
import useSwapData from "@/src/hooks/useAssetPair/useSwapData";
import {DefaultTxParams, MaxDeadline} from "@/src/utils/constants";
import {PoolId} from "mira-dex-ts";

type Props = {
  swapState: SwapState;
  mode: CurrencyBoxMode;
  slippage: number;
  pools: PoolId[] | undefined;
}

const useSwap = ({ swapState, mode, slippage, pools }: Props) => {
  const { wallet } = useWallet();
  const miraDex = useMiraDex();
  const swapData = useSwapData(swapState);
  const { sellAssetIdInput, buyAssetIdInput, sellDecimals, buyDecimals } = swapData;

  const getTxCost = useCallback(async () => {
    if (!wallet || !miraDex || !pools) {
      return;
    }

    const sellAmount = Number(swapState.sell.amount) * 10 ** sellDecimals;
    const buyAmount = Number(swapState.buy.amount) * 10 ** buyDecimals;

    const buyAmountWithSlippage = Math.ceil(buyAmount * (1 - slippage / 100));
    const sellAmountWithSlippage = Math.floor(sellAmount * (1 + slippage / 100));

    const tx = mode === 'sell' ?
      await miraDex.swapExactInput(sellAmount, sellAssetIdInput, buyAmountWithSlippage, pools, MaxDeadline, DefaultTxParams) :
      await miraDex.swapExactOutput(buyAmount, buyAssetIdInput, sellAmountWithSlippage, pools, MaxDeadline, DefaultTxParams);

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
    pools,
  ]);

  const sendTx = useCallback(async (inputTx: ScriptTransactionRequest) => {
    if (!wallet) {
      return;
    }

    const txCost = await wallet.getTransactionCost(inputTx);
    const fundedTx = await wallet.fund(inputTx, txCost);
    const tx = await wallet.sendTransaction(fundedTx, { estimateTxDependencies: true });
    return await tx.waitForResult();
  }, [wallet]);

  const { mutateAsync: fetchTxCost, data: txCostData, isPending: txCostPending, error: txCostError, reset: resetTxCost } = useMutation({
    mutationFn: getTxCost,
  });

  const { mutateAsync: triggerSwap, data: swapResult, isPending: swapPending, error: swapError, reset: resetSwap } = useMutation({
    mutationFn: sendTx,
  });

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
};

export default useSwap;
