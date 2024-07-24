import type {CurrencyBoxMode, SwapState} from "@/src/components/common/Swap/Swap";
import useMiraDex from "@/src/hooks/useMiraDex/useMiraDex";
import useSwapData from "@/src/hooks/useAssetPair/useSwapData";
import {useMutation} from "@tanstack/react-query";
import {DefaultDeadline, DefaultTxParams} from "@/src/utils/constants";
import {useWallet} from "@fuels/react";
import {useCallback} from "react";

type Props = {
  swapState: SwapState;
  mode: CurrencyBoxMode;
  slippage: number;
}

const useSwap = ({ swapState, mode, slippage }: Props) => {
  const { wallet } = useWallet();
  const miraDex = useMiraDex();
  const swapData = useSwapData(swapState);

  const mutationFn = useCallback(async () => {
    if (!wallet || !miraDex) {
      return;
    }

    const { assets, sellDecimals, buyDecimals } = swapData;
    const sellAmount = Number(swapState.sell.amount) * 10 ** sellDecimals;
    const buyAmount = Number(swapState.buy.amount) * 10 ** buyDecimals;

    const buyAmountWithSlippage = buyAmount * (1 - slippage / 100);
    const sellAmountWithSlippage = sellAmount * (1 + slippage / 100);

    const result = mode === 'sell' ?
      await miraDex.swapExactInput(assets, sellAmount, buyAmountWithSlippage, DefaultDeadline, DefaultTxParams) :
      await miraDex.swapExactOutput(assets, buyAmount, sellAmountWithSlippage, DefaultDeadline, DefaultTxParams);

    console.log(result);

    return await wallet.sendTransaction(result);
  }, [wallet, miraDex, swapData, swapState.buy.amount, swapState.sell.amount, slippage, mode]);

  const { mutate, mutateAsync, data, isPending } = useMutation({
    mutationFn
  });

  return { mutate, mutateAsync, data, isPending };
};

export default useSwap;
