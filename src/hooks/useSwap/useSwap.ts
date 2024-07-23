import type {CurrencyBoxMode, SwapState} from "@/src/components/common/Swap/Swap";
import useMiraAmm from "@/src/hooks/useMiraAmm/useMiraAmm";
import useSwapData from "@/src/hooks/useAssetPair/useSwapData";
import {useMutation} from "@tanstack/react-query";
import {DefaultDeadline, DefaultTxParams} from "@/src/utils/constants";
import {useWallet} from "@fuels/react";

type Props = {
  swapState: SwapState;
  mode: CurrencyBoxMode;
}

const useSwap = ({ swapState, mode }: Props) => {
  const { wallet } = useWallet();
  const miraAmm = useMiraAmm();
  const swapData = useSwapData(swapState);

  const mutationFn = async () => {
    if (!wallet || !miraAmm || !swapData) {
      return;
    }

    const { assetPair, sellDecimals, buyDecimals } = swapData;
    const sellAmount = Number(swapState.sell.amount) * 10 ** sellDecimals;
    const buyAmount = Number(swapState.buy.amount) * 10 ** buyDecimals;

    const result = mode === 'sell' ?
      await miraAmm.swapExactInput(assetPair, sellAmount, buyAmount, DefaultDeadline, DefaultTxParams) :
      await miraAmm.swapExactOutput(assetPair, buyAmount, sellAmount, DefaultDeadline, DefaultTxParams);

    return await wallet.sendTransaction(result);
  };

  const { mutate, mutateAsync, data, isPending } = useMutation({
    mutationFn
  });

  return { mutate, mutateAsync, data, isPending };
};

export default useSwap;
