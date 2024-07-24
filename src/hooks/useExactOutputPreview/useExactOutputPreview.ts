import useMiraDex from "@/src/hooks/useMiraDex/useMiraDex";
import {useQuery} from "@tanstack/react-query";
import type {CurrencyBoxMode, SwapState} from "@/src/components/common/Swap/Swap";
import type {AssetInput} from "mira-dex-ts/src/typegen/amm-contract/AmmContractAbi";
import useSwapData from "@/src/hooks/useAssetPair/useSwapData";

type Props = {
  swapState: SwapState;
  buyAmount: number | null;
  lastFocusedMode: CurrencyBoxMode;
}

const useExactOutputPreview = ({ swapState, buyAmount, lastFocusedMode }: Props) => {
  const {
    buyAssetIdInput,
    sellAssetId,
    buyAssetId,
    assets,
    buyDecimals: decimals,
  } = useSwapData(swapState);

  const amountValid = buyAmount !== null && !isNaN(buyAmount);
  const amount = amountValid ? buyAmount * 10 ** decimals : 0;
  const assetSwapInput: AssetInput = {
    id: buyAssetIdInput, amount
  };

  const miraAmm = useMiraDex();

  const miraExists = Boolean(miraAmm);
  const lastFocusedModeIsBuy = lastFocusedMode === 'buy'
  const sellAssetExists = Boolean(sellAssetId);
  const buyAssetExists = Boolean(buyAssetId);
  const amountNonZero = amount > 0;
  const shouldFetch =
    miraExists && lastFocusedModeIsBuy && sellAssetExists && buyAssetExists && amountNonZero;

  const { data, isFetching } = useQuery({
    queryKey: ['exactOutputPreview', assets, assetSwapInput],
    queryFn: () => miraAmm?.multihopPreviewSwapExactOutput(
      assets,
      amount,
    ),
    enabled: shouldFetch,
    refetchInterval: 15000,
  });

  return { data, isFetching };
};

export default useExactOutputPreview;
