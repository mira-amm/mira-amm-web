import {useState} from "react";
import {PoolId} from "mira-dex-ts";
import {useLiquidityAmounts} from "./useLiquidityAmounts";
import {useLiquidityValidation} from "./useLiquidityValidation";
import {useLiquidityPreview} from "./useLiquidityPreview";
import {useLiquidityActions} from "./useLiquidityActions";
import {usePoolInfo} from "./usePoolInfo";
import {BN} from "fuels";

type UseLiquidityFormProps = {
  poolId: PoolId;
  firstAssetBalance: BN;
  secondAssetBalance: BN;
  onPreview?: (data: any) => void;
  onPreviewError?: (error: any) => void;
  enableAutoSync?: boolean;
};

export const useLiquidityForm = ({
  poolId,
  firstAssetBalance,
  secondAssetBalance,
  onPreview,
  onPreviewError,
  enableAutoSync = true,
}: UseLiquidityFormProps) => {
  const [isStablePool, setIsStablePool] = useState(poolId[2]);

  const {
    firstAmount,
    firstAmountInput,
    secondAmount,
    secondAmountInput,
    activeAsset,
    isFirstToken,
    setAmount,
    setAmountForCoin,
    resetAmounts,
    updateSecondAmount,
    updateFirstAmount,
    clearFirstAmount,
    clearSecondAmount,
    asset0Metadata,
    asset1Metadata,
  } = useLiquidityAmounts(poolId);

  const {emptyPool, apr, aprValue, tvlValue} = usePoolInfo(poolId);

  const validation = useLiquidityValidation({
    firstAmount,
    secondAmount,
    firstAssetBalance,
    secondAssetBalance,
    firstAssetId: poolId[0].bits,
    secondAssetId: poolId[1].bits,
    asset0Decimals: asset0Metadata.decimals,
    asset1Decimals: asset1Metadata.decimals,
  });

  const {isFetching, previewError} = useLiquidityPreview({
    firstAssetId: poolId[0].bits,
    secondAssetId: poolId[1].bits,
    firstAmount,
    secondAmount,
    isFirstToken,
    isStablePool,
    emptyPool,
    updateFirstAmount,
    updateSecondAmount,
    asset0Decimals: asset0Metadata.decimals,
    asset1Decimals: asset1Metadata.decimals,
    onPreviewError,
    enableAutoSync,
  });

  const {handleButtonClick} = useLiquidityActions({
    sufficientEthBalance: validation.sufficientEthBalance,
    firstAmount,
    secondAmount,
    poolId,
    isStablePool,
    onPreview,
  });

  return {
    // Amounts
    firstAmount,
    firstAmountInput,
    secondAmount,
    secondAmountInput,
    activeAsset,
    isFirstToken,
    setAmount,
    setAmountForCoin,
    resetAmounts,
    clearFirstAmount,
    clearSecondAmount,

    // Pool info
    isStablePool,
    setIsStablePool,
    emptyPool,
    apr,
    aprValue,
    tvlValue,

    // Validation
    ...validation,

    // Preview
    isFetching,
    previewError,

    // Actions
    handleButtonClick,

    // Metadata
    asset0Metadata,
    asset1Metadata,
  };
};
