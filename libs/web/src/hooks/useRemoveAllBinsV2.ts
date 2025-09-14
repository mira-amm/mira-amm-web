"use client";

import {useMutation, useQueryClient} from "@tanstack/react-query";
import {useMiraSDK} from "@/src/core/providers/MiraSDKProvider";
import {useCallback} from "react";
import {useWallet} from "@fuels/react";
import {DefaultTxParams, MaxDeadline} from "@/src/utils/constants";
import {bn, BN} from "fuels";
import {V2BinPosition} from "./useUserBinPositionsV2";
import {
  isV2MockEnabled,
  mockRemoveLiquidityV2,
  mockDelay,
} from "../utils/mockConfig";

export interface RemoveAllBinsV2Params {
  poolId: BN;
  userPositions: V2BinPosition[];
  slippage: number;
}

export function useRemoveAllBinsV2({
  poolId,
  userPositions,
  slippage,
}: RemoveAllBinsV2Params) {
  const {miraV2} = useMiraSDK();
  const {wallet} = useWallet();
  const queryClient = useQueryClient();

  const mutationFn = useCallback(async () => {
    // Mock mode for testing without contracts
    if (isV2MockEnabled()) {
      const binIds = userPositions.map((pos) => pos.binId.toNumber());
      const totalLiquidity = userPositions.reduce(
        (total, pos) => ({
          x: total.x.add(pos.underlyingAmounts.x),
          y: total.y.add(pos.underlyingAmounts.y),
        }),
        {x: new BN(0), y: new BN(0)}
      );

      const result = await mockRemoveLiquidityV2({
        poolId: poolId.toString(),
        binIds,
        amounts: totalLiquidity,
      });

      // Simulate successful removal
      queryClient.invalidateQueries({
        queryKey: ["userBinPositionsV2", poolId.toString()],
      });

      return {
        id: result.transactionId,
        status: "success",
        gasUsed: new BN(100000),
      };
    }

    if (!miraV2 || !wallet || userPositions.length === 0) {
      return;
    }

    // Extract all bin IDs and LP token amounts from user positions
    const binIds = userPositions.map((position) => position.binId);
    const lpTokenAmounts = userPositions.map(
      (position) => position.lpTokenAmount
    );

    // Calculate total expected underlying amounts
    const totalUnderlyingX = userPositions.reduce(
      (total, position) => total.add(position.underlyingAmounts.x),
      new BN(0)
    );

    const totalUnderlyingY = userPositions.reduce(
      (total, position) => total.add(position.underlyingAmounts.y),
      new BN(0)
    );

    // Apply slippage protection to minimum amounts
    const minAmountX = totalUnderlyingX
      .mul(bn(10_000).sub(bn(slippage)))
      .div(bn(10_000));

    const minAmountY = totalUnderlyingY
      .mul(bn(10_000).sub(bn(slippage)))
      .div(bn(10_000));

    // Remove liquidity from all user bins
    const {transactionRequest: txRequest} = await miraV2.removeLiquidity(
      poolId,
      binIds,
      lpTokenAmounts,
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

    // Invalidate user positions query to refresh data
    queryClient.invalidateQueries({
      queryKey: ["userBinPositionsV2", poolId.toString()],
    });

    return result;
  }, [miraV2, wallet, userPositions, poolId, slippage, queryClient]);

  const {data, mutateAsync, isPending, error} = useMutation({
    mutationFn,
  });

  return {data, mutateAsync, isPending, error};
}

// Hook for removing liquidity from specific bins (for future advanced use)
export function useRemoveSpecificBinsV2({
  poolId,
  slippage,
}: {
  poolId: BN;
  slippage: number;
}) {
  const {miraV2} = useMiraSDK();
  const {wallet} = useWallet();
  const queryClient = useQueryClient();

  const mutationFn = useCallback(
    async (selectedPositions: V2BinPosition[]) => {
      if (!miraV2 || !wallet || selectedPositions.length === 0) {
        return;
      }

      const binIds = selectedPositions.map((position) => position.binId);
      const lpTokenAmounts = selectedPositions.map(
        (position) => position.lpTokenAmount
      );

      const totalUnderlyingX = selectedPositions.reduce(
        (total, position) => total.add(position.underlyingAmounts.x),
        new BN(0)
      );

      const totalUnderlyingY = selectedPositions.reduce(
        (total, position) => total.add(position.underlyingAmounts.y),
        new BN(0)
      );

      const minAmountX = totalUnderlyingX
        .mul(bn(10_000).sub(bn(slippage)))
        .div(bn(10_000));

      const minAmountY = totalUnderlyingY
        .mul(bn(10_000).sub(bn(slippage)))
        .div(bn(10_000));

      const {transactionRequest: txRequest} = await miraV2.removeLiquidity(
        poolId,
        binIds,
        lpTokenAmounts,
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

      // Invalidate user positions query to refresh data
      queryClient.invalidateQueries({
        queryKey: ["userBinPositionsV2", poolId.toString()],
      });

      return result;
    },
    [miraV2, wallet, poolId, slippage, queryClient]
  );

  const {data, mutateAsync, isPending, error} = useMutation({
    mutationFn,
  });

  return {data, mutateAsync, isPending, error};
}
