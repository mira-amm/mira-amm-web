"use client";

import {useCallback, useMemo, useState} from "react";
import {BN, bn} from "fuels";
import {useAddLiquidityV2} from "./useAddLiquidityV2";
import {PoolTypeOption} from "../components/common/PoolTypeToggle/PoolTypeToggle";
import {isV2MockEnabled, mockAddLiquidityV2} from "../utils/mockConfig";

interface UseLiquidityFormV2IntegrationProps {
  poolType: PoolTypeOption;
  firstAmount: BN;
  secondAmount: BN;
  poolId?: BN; // v2 pool ID
  onPreview?: (data: any) => void;
  v2Config?: {
    liquidityShape: string;
    priceRange: [number, number];
    numBins: number;
    binResults?: any;
    liquidityDistribution?: any;
  } | null;
}

export function useLiquidityFormV2Integration({
  poolType,
  firstAmount,
  secondAmount,
  poolId,
  onPreview,
  v2Config,
}: UseLiquidityFormV2IntegrationProps) {
  // Only use v2 functionality if pool type is v2 and we have a valid pool ID
  const shouldUseV2 = poolType === "v2" && (poolId || isV2MockEnabled());
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const v2AddLiquidity = useAddLiquidityV2({
    poolId: poolId || new BN(0),
    firstAssetAmount: firstAmount,
    secondAssetAmount: secondAmount,
    slippage: 50, // 0.5% slippage
    liquidityDistribution: v2Config?.liquidityDistribution,
  });

  const handleV2ButtonClick = useCallback(async () => {
    if (!shouldUseV2) return;

    try {
      setError(null);
      setIsPending(true);

      // Mock mode for testing without contracts
      if (isV2MockEnabled() && !poolId) {
        const mockResult = await mockAddLiquidityV2({
          poolId: "1001", // Use default mock pool
          amountX: firstAmount.toString(),
          amountY: secondAmount.toString(),
          binConfig: {
            strategy: v2Config?.liquidityShape || "single-active-bin",
            numBins: v2Config?.numBins || 1,
            priceRange: v2Config?.priceRange || [0.8, 1.2],
            liquidityDistribution: v2Config?.liquidityDistribution,
          },
        });

        if (onPreview) {
          const previewData = {
            poolId: "1001",
            firstAmount: firstAmount.toString(),
            secondAmount: secondAmount.toString(),
            type: "v2-concentrated",
            binStrategy: v2Config?.liquidityShape || "single-active-bin",
            numBins: v2Config?.numBins || 1,
            priceRange: v2Config?.priceRange || [0.8, 1.2],
            liquidityDistribution: v2Config?.liquidityDistribution,
            isMock: true,
            mockResult,
          };
          onPreview(previewData);
        }
        return;
      }

      // Real v2 functionality
      if (poolId) {
        if (onPreview) {
          const previewData = {
            poolId: poolId.toString(),
            firstAmount: firstAmount.toString(),
            secondAmount: secondAmount.toString(),
            type: "v2-concentrated",
            binStrategy: v2Config?.liquidityShape || "single-active-bin",
            numBins: v2Config?.numBins || 1,
            priceRange: v2Config?.priceRange || [0.8, 1.2],
            liquidityDistribution: v2Config?.liquidityDistribution,
          };
          onPreview(previewData);
        } else {
          // Direct execution
          await v2AddLiquidity.mutateAsync();
        }
      }
    } catch (error) {
      console.error("V2 add liquidity failed:", error);
      setError(error as Error);
      throw error;
    } finally {
      setIsPending(false);
    }
  }, [
    shouldUseV2,
    poolId,
    firstAmount,
    secondAmount,
    onPreview,
    v2AddLiquidity,
  ]);

  const v2ButtonTitle = useMemo(() => {
    if (!shouldUseV2) return null;

    if (!firstAmount.gt(0) || !secondAmount.gt(0)) {
      return "Enter amounts";
    }

    if (v2Config) {
      const binText =
        v2Config.numBins === 1 ? "1 bin" : `${v2Config.numBins} bins`;
      return `Preview ${binText} (${v2Config.liquidityShape})`;
    }

    return "Preview V2 Liquidity";
  }, [shouldUseV2, firstAmount, secondAmount, v2Config]);

  const v2ButtonDisabled = useMemo(() => {
    if (!shouldUseV2) return false;

    const isLoading = isV2MockEnabled() ? isPending : v2AddLiquidity.isPending;
    const hasValidAmounts = firstAmount.gt(0) && secondAmount.gt(0);
    const hasValidConfig = v2Config && v2Config.numBins > 0;

    return !hasValidAmounts || !hasValidConfig || isLoading;
  }, [
    shouldUseV2,
    firstAmount,
    secondAmount,
    v2Config,
    isPending,
    v2AddLiquidity.isPending,
  ]);

  return {
    shouldUseV2,
    handleV2ButtonClick,
    v2ButtonTitle,
    v2ButtonDisabled,
    v2IsPending: isV2MockEnabled() ? isPending : v2AddLiquidity.isPending,
    v2Error: isV2MockEnabled() ? error : v2AddLiquidity.error,
  };
}
