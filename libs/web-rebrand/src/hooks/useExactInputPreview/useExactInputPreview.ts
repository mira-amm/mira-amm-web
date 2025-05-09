import {useQuery} from "@tanstack/react-query";
import type {
  CurrencyBoxMode,
  SwapState,
} from "@/src/components/common/Swap/Swap";
import useSwapData from "@/src/hooks/useAssetPair/useSwapData";
import useReadonlyMira from "@/src/hooks/useReadonlyMira";
import {buildPoolId} from "mira-dex-ts";

type Props = {
  swapState: SwapState;
  sellAmount: number | null;
  lastFocusedMode: CurrencyBoxMode;
};

const useExactInputPreview = ({
  swapState,
  sellAmount,
  lastFocusedMode,
}: Props) => {
  const {
    sellAssetIdInput,
    buyAssetIdInput,
    sellDecimals: decimals,
  } = useSwapData(swapState);

  const pool = buildPoolId(sellAssetIdInput.bits, buyAssetIdInput.bits, false);

  const amountValid = sellAmount !== null && !isNaN(sellAmount);
  const amount = amountValid ? sellAmount * 10 ** decimals : 0;
  const amountNonZero = amount > 0;

  const miraAmm = useReadonlyMira();
  const miraExists = Boolean(miraAmm);

  const lastFocusedModeIsSell = lastFocusedMode === "sell";
  const shouldFetch = miraExists && lastFocusedModeIsSell && amountNonZero;

  const {data, isFetching, error} = useQuery({
    queryKey: ["exactInputPreview", sellAssetIdInput.bits, amount, pool],
    queryFn: () =>
      miraAmm?.previewSwapExactInput(sellAssetIdInput, amount, [pool]),
    enabled: shouldFetch,
    refetchInterval: 15000,
  });

  return {data, isFetching, error};
};

export default useExactInputPreview;
