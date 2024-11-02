import {useMemo} from "react";

import type {CurrencyBoxMode, SwapState} from "@/src/components/common/Swap/Swap";
import {coinsConfig} from "@/src/utils/coinsConfig";
import {DefaultLocale} from "@/src/utils/constants";
import {getAssetDecimalsByAssetId, getAssetNameByAssetId} from "@/src/utils/common";

type Props = {
  firstAssetId: string | null;
  secondAssetId: string | null;
  firstAssetAmount: string;
  secondAssetAmount: string;
  baseAssetId: string | null;
}

const useExchangeRateV2 = ({ firstAssetId, secondAssetId, firstAssetAmount, secondAssetAmount, baseAssetId }: Props): string | null => {
  return useMemo(() => {
    const showRate = firstAssetId !== null && secondAssetId !== null && firstAssetAmount !== '' && secondAssetAmount !== '';
    if (!showRate) {
      return null;
    }

    const firstAssetIsBase = baseAssetId === firstAssetId;

    const activeModeAmountValue = parseFloat(firstAssetIsBase ? firstAssetAmount : secondAssetAmount);
    if (activeModeAmountValue === 0) {
      return null;
    }

    const anotherAssetDecimals = getAssetDecimalsByAssetId(firstAssetIsBase ? secondAssetId : firstAssetId);
    const firstAssetName = getAssetNameByAssetId(firstAssetId);
    const secondAssetName = getAssetNameByAssetId(secondAssetId);

    const assetNameToUseForBase = firstAssetIsBase ? firstAssetName : secondAssetName;
    const assetNameToUseForAnother = firstAssetIsBase ? secondAssetName : firstAssetName;

    const rate = parseFloat(firstAssetIsBase ? firstAssetAmount : secondAssetAmount) / parseFloat(firstAssetIsBase ? secondAssetAmount : firstAssetAmount);
    return `1 ${assetNameToUseForBase} ≈ ${rate.toLocaleString(DefaultLocale, { minimumFractionDigits: anotherAssetDecimals })} ${assetNameToUseForAnother}`;
  }, [baseAssetId, firstAssetAmount, firstAssetId, secondAssetAmount, secondAssetId]);
};

export default useExchangeRateV2;
