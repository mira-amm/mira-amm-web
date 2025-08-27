"use client";

import {useMutation, useQueryClient} from "@tanstack/react-query";
import {useMiraDexV2} from "@/src/hooks";
import {useCallback} from "react";
import {useWallet} from "@fuels/react";
import {DefaultTxParams, MaxDeadline} from "@/src/utils/constants";
import {bn, BN} from "fuels";
import {
  isV2MockEnabled,
  mockDelay,
  updateMockUserPosition,
} from "../utils/mockConfig";

export interface AddLiquidityToBinParams {
  poolId: BN;
  binId: BN;
  amountX: BN;
  amountY: BN;
  slippage?: number;
}

export interface RemoveLiquidityFromBinParams {
  poolId: BN;
  binId: BN;
  lpTokenAmount: BN;
  slippage?: number;
}

/**
 * Hook for adding liquidity to a specific bin in a v2 pool
 */
export function useAddLiquidityToBin() {
  const miraV2 = useMiraDexV2();
  const {wallet} = useWallet();
  const queryClient = useQueryClient();

  const mutationFn = useCallback(
    async ({
      poolId,
      binId,
      amountX,
      amountY,
      slippage = 50,
    }: AddLiquidityToBinParams) => {
      // Mock mode for testing
      if (isV2MockEnabled()) {
        await mockDelay("addLiquidity");

        // Update mock position data
        updateMockUserPosition(poolId.toString(), binId.toString(), {
          type: "add",
          amountX: amountX.toString(),
          amountY: amountY.toString(),
        });

        return {
          transactionId: `mock-add-liquidity-${Date.now()}`,
          success: true,
        };
      }

      if (!miraV2 || !wallet) {
        throw new Error("SDK or wallet not available");
      }

      // Calculate minimum amounts with slippage protection
      const minAmountX = amountX
        .mul(bn(10_000).sub(bn(slippage)))
        .div(bn(10_000));

      const minAmountY = amountY
        .mul(bn(10_000).sub(bn(slippage)))
        .div(bn(10_000));

      // Get current active bin to calculate delta
      const activeBinId = await miraV2.getActiveBin(poolId);
      const deltaId = binId.sub(activeBinId).toNumber();

      // Configure liquidity distribution for this specific bin
      const deltaIds = [{Positive: deltaId}];
      const distributionX = [100]; // 100% of X tokens to this bin
      const distributionY = [100]; // 100% of Y tokens to this bin
      const activeIdDesired = activeBinId;
      const idSlippage = 0; // No bin slippage for single bin

      const {transactionRequest: txRequest} = await miraV2.addLiquidity(
        poolId,
        amountX,
        amountY,
        minAmountX,
        minAmountY,
        MaxDeadline,
        activeIdDesired,
        idSlippage,
        deltaIds,
        distributionX,
        distributionY,
        DefaultTxParams,
        {
          useAssembleTx: true,
        }
      );

      const tx = await wallet.sendTransaction(txRequest);
      return await tx.waitForResult();
    },
    [miraV2, wallet]
  );

  const {data, mutateAsync, isPending, error} = useMutation({
    mutationFn,
    onSuccess: (data, variables) => {
      // Invalidate relevant queries to refresh position data
      queryClient.invalidateQueries({
        queryKey: ["userBinPositionsV2", variables.poolId.toString()],
      });
      queryClient.invalidateQueries({
        queryKey: ["poolMetadataV2", variables.poolId.toString()],
      });
    },
  });

  return {
    addLiquidityToBin: mutateAsync,
    data,
    isPending,
    error,
  };
}

/**
 * Hook for removing liquidity from a specific bin in a v2 pool
 */
export function useRemoveLiquidityFromBin() {
  const miraV2 = useMiraDexV2();
  const {wallet} = useWallet();
  const queryClient = useQueryClient();

  const mutationFn = useCallback(
    async ({
      poolId,
      binId,
      lpTokenAmount,
      slippage = 50,
    }: RemoveLiquidityFromBinParams) => {
      // Mock mode for testing
      if (isV2MockEnabled()) {
        await mockDelay("removeLiquidity");

        // Update mock position data
        updateMockUserPosition(poolId.toString(), binId.toString(), {
          type: "remove",
          lpTokenAmount: lpTokenAmount.toString(),
        });

        return {
          transactionId: `mock-remove-liquidity-${Date.now()}`,
          success: true,
        };
      }

      if (!miraV2 || !wallet) {
        throw new Error("SDK or wallet not available");
      }

      // Get expected underlying amounts for slippage calculation
      const binLiquidity = await miraV2.getBinLiquidity(poolId, binId);
      if (!binLiquidity) {
        throw new Error("Unable to fetch bin liquidity data");
      }

      // Calculate expected underlying amounts based on LP token share
      const totalLpTokens = binLiquidity.totalSupply || new BN(1);
      const shareRatio = lpTokenAmount.mul(bn(10_000)).div(totalLpTokens);

      const expectedAmountX = binLiquidity.reserveX
        .mul(shareRatio)
        .div(bn(10_000));
      const expectedAmountY = binLiquidity.reserveY
        .mul(shareRatio)
        .div(bn(10_000));

      // Apply slippage protection
      const minAmountX = expectedAmountX
        .mul(bn(10_000).sub(bn(slippage)))
        .div(bn(10_000));

      const minAmountY = expectedAmountY
        .mul(bn(10_000).sub(bn(slippage)))
        .div(bn(10_000));

      // Remove liquidity from the specific bin
      const {transactionRequest: txRequest} = await miraV2.removeLiquidity(
        poolId,
        [binId], // Single bin
        [lpTokenAmount], // Amount to remove from this bin
        minAmountX,
        minAmountY,
        MaxDeadline,
        DefaultTxParams,
        {
          useAssembleTx: true,
        }
      );

      const tx = await wallet.sendTransaction(txRequest);
      return await tx.waitForResult();
    },
    [miraV2, wallet]
  );

  const {data, mutateAsync, isPending, error} = useMutation({
    mutationFn,
    onSuccess: (data, variables) => {
      // Invalidate relevant queries to refresh position data
      queryClient.invalidateQueries({
        queryKey: ["userBinPositionsV2", variables.poolId.toString()],
      });
      queryClient.invalidateQueries({
        queryKey: ["poolMetadataV2", variables.poolId.toString()],
      });
    },
  });

  return {
    removeLiquidityFromBin: mutateAsync,
    data,
    isPending,
    error,
  };
}

/**
 * Hook for partial removal of liquidity from a specific bin
 */
export function usePartialRemoveLiquidityFromBin() {
  const miraV2 = useMiraDexV2();
  const {wallet} = useWallet();
  const queryClient = useQueryClient();

  const mutationFn = useCallback(
    async ({
      poolId,
      binId,
      percentage, // Percentage of position to remove (0-100)
      currentLpTokenAmount,
      slippage = 50,
    }: {
      poolId: BN;
      binId: BN;
      percentage: number;
      currentLpTokenAmount: BN;
      slippage?: number;
    }) => {
      if (percentage <= 0 || percentage > 100) {
        throw new Error("Percentage must be between 1 and 100");
      }

      const lpTokenAmountToRemove = currentLpTokenAmount
        .mul(bn(percentage))
        .div(bn(100));

      // Mock mode for testing
      if (isV2MockEnabled()) {
        await mockDelay("removeLiquidity");

        updateMockUserPosition(poolId.toString(), binId.toString(), {
          type: "remove",
          lpTokenAmount: lpTokenAmountToRemove.toString(),
        });

        return {
          transactionId: `mock-partial-remove-${Date.now()}`,
          success: true,
          percentage,
          removedAmount: lpTokenAmountToRemove.toString(),
        };
      }

      if (!miraV2 || !wallet) {
        throw new Error("SDK or wallet not available");
      }

      // Get expected underlying amounts for slippage calculation
      const binLiquidity = await miraV2.getBinLiquidity(poolId, binId);
      if (!binLiquidity) {
        throw new Error("Unable to fetch bin liquidity data");
      }

      // Calculate expected underlying amounts based on LP token share
      const totalLpTokens = binLiquidity.totalSupply || new BN(1);
      const shareRatio = lpTokenAmountToRemove
        .mul(bn(10_000))
        .div(totalLpTokens);

      const expectedAmountX = binLiquidity.reserveX
        .mul(shareRatio)
        .div(bn(10_000));
      const expectedAmountY = binLiquidity.reserveY
        .mul(shareRatio)
        .div(bn(10_000));

      // Apply slippage protection
      const minAmountX = expectedAmountX
        .mul(bn(10_000).sub(bn(slippage)))
        .div(bn(10_000));

      const minAmountY = expectedAmountY
        .mul(bn(10_000).sub(bn(slippage)))
        .div(bn(10_000));

      // Remove partial liquidity from the specific bin
      const {transactionRequest: txRequest} = await miraV2.removeLiquidity(
        poolId,
        [binId],
        [lpTokenAmountToRemove],
        minAmountX,
        minAmountY,
        MaxDeadline,
        DefaultTxParams,
        {
          useAssembleTx: true,
        }
      );

      const tx = await wallet.sendTransaction(txRequest);
      const result = await tx.waitForResult();

      return {
        ...result,
        percentage,
        removedAmount: lpTokenAmountToRemove.toString(),
      };
    },
    [miraV2, wallet]
  );

  const {data, mutateAsync, isPending, error} = useMutation({
    mutationFn,
    onSuccess: (data, variables) => {
      // Invalidate relevant queries to refresh position data
      queryClient.invalidateQueries({
        queryKey: ["userBinPositionsV2", variables.poolId.toString()],
      });
      queryClient.invalidateQueries({
        queryKey: ["poolMetadataV2", variables.poolId.toString()],
      });
    },
  });

  return {
    partialRemoveLiquidityFromBin: mutateAsync,
    data,
    isPending,
    error,
  };
}
