"use client";

import {useEffect, useMemo, useState} from "react";
import {BN} from "fuels";

import {useLiquidityFormV2Integration} from "./useLiquidityFormV2Integration";

type V2ConfigState = {
  liquidityShape: string;
  priceRange: [number, number];
  numBins: number;
  binResults?: any;
  liquidityDistribution?: any;
  deltaDistribution?: any;
} | null;

interface UseBinLiquidityControllerParams {
  poolType: string;
  firstAmount: BN | undefined | null;
  secondAmount: BN | undefined | null;
  poolId?: BN; // v2 pool id
  asset0Price?: number | null;
  asset1Price?: number | null;
  onPreview?: (data: any) => void;
  clearFirstAmount?: () => void;
  clearSecondAmount?: () => void;
}

export function useBinLiquidityController({
  poolType,
  firstAmount,
  secondAmount,
  poolId,
  asset0Price,
  asset1Price,
  onPreview,
  clearFirstAmount,
  clearSecondAmount,
}: UseBinLiquidityControllerParams) {
  const [v2Config, setV2Config] = useState<V2ConfigState>(null);

  const currentPrice = useMemo(() => {
    if (typeof asset1Price === "number" && typeof asset0Price === "number") {
      return asset1Price / asset0Price;
    }
    return 1;
  }, [asset0Price, asset1Price]);

  const isOutOfRangeLow = useMemo(() => {
    return (
      poolType === "v2" &&
      Boolean(v2Config) &&
      currentPrice !== null &&
      typeof currentPrice === "number" &&
      v2Config!.priceRange &&
      currentPrice < v2Config!.priceRange[0]
    );
  }, [poolType, v2Config, currentPrice]);

  const isOutOfRangeHigh = useMemo(() => {
    return (
      poolType === "v2" &&
      Boolean(v2Config) &&
      currentPrice !== null &&
      typeof currentPrice === "number" &&
      v2Config!.priceRange &&
      currentPrice > v2Config!.priceRange[1]
    );
  }, [poolType, v2Config, currentPrice]);

  // Clear irrelevant amounts when out of range (controller handles this side-effect)
  useEffect(() => {
    if (poolType !== "v2" || !v2Config || currentPrice === null) return;
    if (isOutOfRangeLow) {
      clearFirstAmount?.();
    } else if (isOutOfRangeHigh) {
      clearSecondAmount?.();
    }
  }, [
    poolType,
    v2Config,
    currentPrice,
    isOutOfRangeLow,
    isOutOfRangeHigh,
    clearFirstAmount,
    clearSecondAmount,
  ]);

  const v2Integration = useLiquidityFormV2Integration({
    poolType: poolType as any,
    firstAmount: firstAmount || new BN(0),
    secondAmount: secondAmount || new BN(0),
    poolId,
    onPreview,
    v2Config: v2Config || undefined,
    currentPrice,
  });

  const finalButtonTitle = v2Integration.shouldUseV2
    ? v2Integration.v2ButtonTitle
    : null;

  const finalButtonDisabled = v2Integration.shouldUseV2
    ? v2Integration.v2ButtonDisabled
    : false;

  const finalHandleButtonClick = v2Integration.shouldUseV2
    ? v2Integration.handleV2ButtonClick
    : () => {};

  return {
    shouldUseV2: v2Integration.shouldUseV2,
    v2Config,
    setV2Config,
    currentPrice,
    isOutOfRangeLow,
    isOutOfRangeHigh,
    finalButtonTitle,
    finalButtonDisabled,
    finalHandleButtonClick,
    v2Error: v2Integration.v2Error,
  };
}
