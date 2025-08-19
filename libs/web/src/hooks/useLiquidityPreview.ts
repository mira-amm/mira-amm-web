import {useEffect} from "react";
import {BN} from "fuels";
import {usePreviewAddLiquidity} from "@/src/hooks";

type UseLiquidityPreviewProps = {
  firstAssetId: string;
  secondAssetId: string;
  firstAmount: BN;
  secondAmount: BN;
  isFirstToken: boolean;
  isStablePool: boolean;
  emptyPool: boolean;
  updateFirstAmount: (amount: BN, decimals: number) => void;
  updateSecondAmount: (amount: BN, decimals: number) => void;
  asset0Decimals: number;
  asset1Decimals: number;
  onPreviewError?: (error: any) => void;
};

export const useLiquidityPreview = ({
  firstAssetId,
  secondAssetId,
  firstAmount,
  secondAmount,
  isFirstToken,
  isStablePool,
  emptyPool,
  updateFirstAmount,
  updateSecondAmount,
  asset0Decimals,
  asset1Decimals,
  onPreviewError,
}: UseLiquidityPreviewProps) => {
  const {
    data,
    isFetching,
    error: previewError,
  } = usePreviewAddLiquidity({
    firstAssetId,
    secondAssetId,
    amount: isFirstToken ? firstAmount : secondAmount,
    isFirstToken,
    isStablePool,
    fetchCondition: !emptyPool,
  });

  useEffect(() => {
    if (previewError && onPreviewError) {
      onPreviewError(previewError);
    }
  }, [previewError, onPreviewError]);

  useEffect(() => {
    if (data) {
      const anotherTokenDecimals = isFirstToken
        ? asset1Decimals
        : asset0Decimals;
      const anotherTokenValue = data[1];

      if (isFirstToken) {
        updateSecondAmount(anotherTokenValue, anotherTokenDecimals);
      } else {
        updateFirstAmount(anotherTokenValue, anotherTokenDecimals);
      }
    }
  }, [
    data,
    isFirstToken,
    asset0Decimals,
    asset1Decimals,
    updateFirstAmount,
    updateSecondAmount,
  ]);

  return {
    data,
    isFetching,
    previewError,
  };
};
