import {useQuery} from "@tanstack/react-query";
import type {CurrencyBoxMode, SwapState} from "@/src/components/common/Swap/Swap";
import useSwapData from "@/src/hooks/useAssetPair/useSwapData";
import usePoolsIds from "@/src/hooks/usePoolsIds";
import useReadonlyMira from "@/src/hooks/useReadonlyMira";
import {buildPoolId} from "mira-dex-ts";

type Props = {
  swapState: SwapState;
  buyAmount: number | null;
  lastFocusedMode: CurrencyBoxMode;
}

const useExactOutputPreview = ({ swapState, buyAmount, lastFocusedMode }: Props) => {
  const {
    sellAssetIdInput,
    buyAssetIdInput,
    sellAssetId,
    buyAssetId,
    buyDecimals: decimals,
  } = useSwapData(swapState);

  const amountValid = buyAmount !== null && !isNaN(buyAmount);
  const amount = amountValid ? buyAmount * 10 ** decimals : 0;

  const miraAmm = useReadonlyMira();

  const pool = buildPoolId(sellAssetIdInput.bits, buyAssetIdInput.bits, false);

  const miraExists = Boolean(miraAmm);
  const lastFocusedModeIsBuy = lastFocusedMode === 'buy'
  const sellAssetExists = Boolean(sellAssetId);
  const buyAssetExists = Boolean(buyAssetId);
  const amountNonZero = amount > 0;
  const shouldFetch =
    miraExists && lastFocusedModeIsBuy && sellAssetExists && buyAssetExists && amountNonZero;

  const { data, isFetching } = useQuery({
    queryKey: ['exactOutputPreview', buyAssetIdInput, amount, pool],
    queryFn: () => miraAmm?.previewSwapExactOutput(
      buyAssetIdInput,
      amount,
      [pool],
    ),
    enabled: shouldFetch,
    refetchInterval: 15000,
  });

  return { data, isFetching };
};

export default useExactOutputPreview;
