import type {CurrencyBoxMode, SwapState} from "@/src/components/common/Swap/Swap";
import useMiraDex from "@/src/hooks/useMiraDex/useMiraDex";
import useSwapData from "@/src/hooks/useAssetPair/useSwapData";
import {useMutation} from "@tanstack/react-query";
import {DefaultDeadline, DefaultTxParams} from "@/src/utils/constants";
import {useWallet} from "@fuels/react";
import {useCallback} from "react";
import {ScriptTransactionRequest} from "fuels";

type Props = {
  swapState: SwapState;
  mode: CurrencyBoxMode;
  slippage: number;
}

const useSwap = ({ swapState, mode, slippage }: Props) => {
  const { wallet } = useWallet();
  const miraDex = useMiraDex();
  const swapData = useSwapData(swapState);

  const getTxCost = useCallback(async () => {
    if (!wallet || !miraDex) {
      return;
    }

    const { assets, sellDecimals, buyDecimals } = swapData;
    const sellAmount = Number(swapState.sell.amount) * 10 ** sellDecimals;
    const buyAmount = Number(swapState.buy.amount) * 10 ** buyDecimals;

    const buyAmountWithSlippage = buyAmount * (1 - slippage / 100);
    const sellAmountWithSlippage = sellAmount * (1 + slippage / 100);

    const tx = mode === 'sell' ?
      await miraDex.swapExactInput(assets, sellAmount, buyAmountWithSlippage, DefaultDeadline, DefaultTxParams) :
      await miraDex.swapExactOutput(assets, buyAmount, sellAmountWithSlippage, DefaultDeadline, DefaultTxParams);

    const txCost = await wallet.provider.getTransactionCost(tx);

    return { tx, txCost };
  }, [wallet, miraDex, swapData, swapState.buy.amount, swapState.sell.amount, slippage, mode]);

  const sendTx = useCallback(async (tx: ScriptTransactionRequest) => {
    if (!wallet) {
      return;
    }

    return await wallet.sendTransaction(tx);
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
