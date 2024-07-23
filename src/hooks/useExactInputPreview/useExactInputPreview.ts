import useMiraDex from "@/src/hooks/useMiraDex/useMiraDex";
import {coinsConfig} from "@/src/utils/coinsConfig";
import {useQuery} from "@tanstack/react-query";
import type {CurrencyBoxMode, SwapState} from "@/src/components/common/Swap/Swap";
import {DefaultTxParams} from "@/src/utils/constants";
import type {AssetInput, AssetIdInput} from "mira-dex-ts/src/typegen/amm-contract/AmmContractAbi";

type Props = {
  swapState: SwapState;
  sellAmount: number | null;
  lastFocusedMode: CurrencyBoxMode;
}

const useExactInputPreview = ({ swapState, sellAmount, lastFocusedMode }: Props) => {
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
  const decimals = coinsConfig.get(swapState.sell.coin)?.decimals!;
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
    queryKey: ['exactInputPreview', assetPair, assetSwapInput],
    queryFn: () => miraAmm?.previewSwapExactInput(
      assetPair,
      assetSwapInput,
      DefaultTxParams,
    ),
    enabled: shouldFetch,
    refetchInterval: 15000,
  });

  return { data, isFetching, isPending };
};

export default useExactInputPreview;
