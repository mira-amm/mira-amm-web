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
  buyAmount: number | null;
  lastFocusedMode: CurrencyBoxMode;
};

const useExactOutputPreview = ({
  swapState,
  buyAmount,
  lastFocusedMode,
}: Props) => {
  const {
    sellAssetIdInput,
    buyAssetIdInput,
    buyDecimals: decimals,
  } = useSwapData(swapState);

  const pool = buildPoolId(sellAssetIdInput.bits, buyAssetIdInput.bits, false);

  const amountValid = buyAmount !== null && !isNaN(buyAmount);
  const amount = amountValid ? buyAmount * 10 ** decimals : 0;
  const amountNonZero = amount > 0;

  const miraAmm = useReadonlyMira();
  const miraExists = Boolean(miraAmm);

  const lastFocusedModeIsBuy = lastFocusedMode === "buy";
  const shouldFetch = miraExists && lastFocusedModeIsBuy && amountNonZero;

  const {data, isFetching, error} = useQuery({
    queryKey: ["exactOutputPreview", buyAssetIdInput.bits, amount, pool],
    queryFn: () =>
      miraAmm?.previewSwapExactOutput(buyAssetIdInput, amount, [pool]),
    enabled: shouldFetch,
    refetchInterval: 15000,
  });

  return {data, isFetching, error};
};

export default useExactOutputPreview;
