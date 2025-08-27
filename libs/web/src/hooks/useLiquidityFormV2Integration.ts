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
}

export function useLiquidityFormV2Integration({
  poolType,
  firstAmount,
  secondAmount,
  poolId,
  onPreview,
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
          binConfig: {strategy: "single-active-bin"},
        });

        if (onPreview) {
          const previewData = {
            poolId: "1001",
            firstAmount: firstAmount.toString(),
            secondAmount: secondAmount.toString(),
            type: "v2-simple",
            binStrategy: "single-active-bin",
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
            type: "v2-simple",
            binStrategy: "single-active-bin",
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

    return "Preview V2 Liquidity";
  }, [shouldUseV2, firstAmount, secondAmount]);

  const v2ButtonDisabled = useMemo(() => {
    if (!shouldUseV2) return false;

    const isLoading = isV2MockEnabled() ? isPending : v2AddLiquidity.isPending;
    return !firstAmount.gt(0) || !secondAmount.gt(0) || isLoading;
  }, [
    shouldUseV2,
    firstAmount,
    secondAmount,
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
