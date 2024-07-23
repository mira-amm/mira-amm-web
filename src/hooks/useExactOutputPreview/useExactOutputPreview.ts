import {coinsConfig} from "@/src/utils/coinsConfig";
import useMiraDex from "@/src/hooks/useMiraDex/useMiraDex";
import {useQuery} from "@tanstack/react-query";
import type {CurrencyBoxMode, SwapState} from "@/src/components/common/Swap/Swap";
import {DefaultTxParams} from "@/src/utils/constants";
import type {AssetIdInput, AssetInput} from "mira-dex-ts/src/typegen/amm-contract/AmmContractAbi";

type Props = {
  swapState: SwapState;
  buyAmount: number | null;
  lastFocusedMode: CurrencyBoxMode;
}

const useExactOutputPreview = ({ swapState, buyAmount, lastFocusedMode }: Props) => {
  const sellAssetId = coinsConfig.get(swapState.sell.coin)?.assetId!;
  const buyAssetId = coinsConfig.get(swapState.buy.coin)?.assetId!;
  const sellAssetIdInput: AssetIdInput = {
    bits: sellAssetId
  };
  const buyAssetIdInput: AssetIdInput = {
    bits: buyAssetId
  };
  const assetPair: [AssetIdInput, AssetIdInput] = [
    sellAssetIdInput,
    buyAssetIdInput,
  ];
  const decimals = coinsConfig.get(swapState.buy.coin)?.decimals!;
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
    queryKey: ['exactOutputPreview', assetPair, assetSwapInput],
    queryFn: () => miraAmm?.previewSwapExactOutput(
      assetPair,
      assetSwapInput,
      DefaultTxParams,
    ),
    enabled: shouldFetch,
    refetchInterval: 15000,
  });

  return { data, isFetching };
};

export default useExactOutputPreview;
