import useMiraDex from "@/src/hooks/useMiraDex/useMiraDex";
import {useQuery} from "@tanstack/react-query";
import type {CurrencyBoxMode, SwapState} from "@/src/components/common/Swap/Swap";
import type {AssetInput} from "mira-dex-ts/src/typegen/amm-contract/AmmContractAbi";
import useSwapData from "@/src/hooks/useAssetPair/useSwapData";

type Props = {
  swapState: SwapState;
  sellAmount: number | null;
  lastFocusedMode: CurrencyBoxMode;
}

const useExactInputPreview = ({ swapState, sellAmount, lastFocusedMode }: Props) => {
  const {
    sellAssetIdInput,
    sellAssetId,
    buyAssetId,
    assets,
    sellDecimals: decimals,
  } = useSwapData(swapState);

  const amountValid = sellAmount !== null && !isNaN(sellAmount);
  const amount = amountValid ? sellAmount * 10 ** decimals : 0;
  const assetSwapInput: AssetInput = {
    id: sellAssetIdInput, amount
  };

  const miraAmm = useMiraDex();

  const miraExists = Boolean(miraAmm);
  const lastFocusedModeIsSell = lastFocusedMode === 'sell';
  const sellAssetExists = Boolean(sellAssetId);
  const buyAssetExists = Boolean(buyAssetId);
  const amountNonZero = amount > 0;
  const shouldFetch =
    miraExists && lastFocusedModeIsSell && sellAssetExists && buyAssetExists && amountNonZero;

  const { data, isFetching, isPending } = useQuery({
    queryKey: ['exactInputPreview', assets, assetSwapInput],
    queryFn: () => miraAmm?.multihopPreviewSwapExactInput(
      assets,
      assetSwapInput,
    ),
    enabled: shouldFetch,
    refetchInterval: 15000,
  });

  return { data, isFetching, isPending };
};

export default useExactInputPreview;
