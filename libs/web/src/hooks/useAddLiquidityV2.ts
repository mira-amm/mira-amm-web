"use client";

import {useMutation} from "@tanstack/react-query";
import {useMiraDexV2, useReadonlyMiraV2} from "@/src/hooks";
import {useCallback} from "react";
import {useWallet} from "@fuels/react";
import {DefaultTxParams, MaxDeadline} from "@/src/utils/constants";
import {bn, BN} from "fuels";
import type {LiquidityDistributionResult} from "@/src/components/pages/add-liquidity-page/components/AddLiquidity/liquidityDistributionGenerator";

export function useAddLiquidityV2({
  poolId,
  firstAssetAmount,
  secondAssetAmount,
  slippage = 50, // 0.5% default slippage (basis points)
  liquidityDistribution,
}: {
  poolId: BN;
  firstAssetAmount: BN;
  secondAssetAmount: BN;
  slippage?: number;
  liquidityDistribution?: LiquidityDistributionResult;
}) {
  const miraV2 = useMiraDexV2();
  const readonlyMiraV2 = useReadonlyMiraV2();
  const {wallet} = useWallet();

  const mutationFn = useCallback(async () => {
    if (!miraV2 || !wallet) {
      return;
    }

    // For simple v2 add liquidity, we'll add to the active bin only
    // This makes it equivalent to v1 behavior
    const minAsset0Amount = firstAssetAmount
      .mul(bn(10_000).sub(bn(slippage)))
      .div(bn(10_000));

    const minAsset1Amount = secondAssetAmount
      .mul(bn(10_000).sub(bn(slippage)))
      .div(bn(10_000));

    // Determine on-chain active bin and bin step for id slippage mapping
    let activeIdDesired: number | undefined = undefined;
    let idSlippage = 0;
    if (readonlyMiraV2) {
      const [activeId, metadata] = await Promise.all([
        readonlyMiraV2.getActiveBin(poolId),
        readonlyMiraV2.poolMetadata(poolId),
      ]);
      if (activeId !== null) {
        activeIdDesired = activeId;
      }
      if (metadata) {
        // Map percentage slippage to number of bins using binStep (both in basis points)
        const binStepBps = metadata.pool.binStep; // e.g., 25 -> 0.25%
        // slippage is in basis points (e.g., 100 -> 1%)
        if (binStepBps > 0) {
          idSlippage = Math.floor(slippage / binStepBps);
        }
      }
    }

    // If liquidityDistribution is available, convert it to deltaIds and distributions.
    // Otherwise, fall back to a single-bin distribution at the (current) active bin.
    let deltaIds: Array<{Positive?: number; Negative?: number}> = [];
    let distributionX: number[] = [];
    let distributionY: number[] = [];

    if (liquidityDistribution && liquidityDistribution.bins.length > 0) {
      const chainActiveId =
        activeIdDesired ?? liquidityDistribution.activeBinId;

      // Compute totals for percentage calculation
      const totalX = liquidityDistribution.bins.reduce(
        (sum, b) => sum + (b.liquidityX || 0),
        0
      );
      const totalY = liquidityDistribution.bins.reduce(
        (sum, b) => sum + (b.liquidityY || 0),
        0
      );

      // Build arrays using only bins with some liquidity on either side
      const selectedBins = liquidityDistribution.bins.filter(
        (b) => (b.liquidityX || 0) > 0 || (b.liquidityY || 0) > 0
      );

      deltaIds = selectedBins.map((b) => {
        const d = b.binId - chainActiveId;
        return d >= 0 ? {Positive: d} : {Negative: Math.abs(d)};
      });

      // Compute raw percentages
      const rawX = selectedBins.map((b) =>
        totalX > 0 ? (b.liquidityX / totalX) * 100 : 0
      );
      const rawY = selectedBins.map((b) =>
        totalY > 0 ? (b.liquidityY / totalY) * 100 : 0
      );

      // Round to integers and fix rounding drift to sum ~100 where applicable
      const roundAndNormalize = (values: number[]): number[] => {
        if (values.every((v) => v === 0)) return values.map(() => 0);
        const rounded = values.map((v) => Math.round(v));
        const sum = rounded.reduce((a, b) => a + b, 0);
        if (sum === 100) return rounded;
        const diff = 100 - sum;
        // Adjust the largest component by the diff to reach exactly 100
        const idx = rounded.reduce(
          (bestIdx, val, i, arr) => (val > arr[bestIdx] ? i : bestIdx),
          0
        );
        rounded[idx] = Math.max(0, rounded[idx] + diff);
        return rounded;
      };

      const pctX = roundAndNormalize(rawX);
      const pctY = roundAndNormalize(rawY);

      // Convert percentages (0-100) to basis points (0-10000) expected by the script (u16)
      const toBps = (arr: number[]) => {
        if (arr.every((v) => v === 0)) return arr.map(() => 0);
        let bps = arr.map((v) => Math.max(0, Math.min(100, v)) * 100);
        const sum = bps.reduce((a, b) => a + b, 0);
        if (sum !== 10000) {
          const diff = 10000 - sum;
          const idx = bps.reduce(
            (bestIdx, val, i, arrVals) =>
              val > arrVals[bestIdx] ? i : bestIdx,
            0
          );
          bps[idx] = Math.max(0, Math.min(10000, bps[idx] + diff));
        }
        return bps;
      };

      distributionX = toBps(pctX);
      distributionY = toBps(pctY);
    } else {
      // Fallback: single active bin (v1-like behavior)
      deltaIds = [{Positive: 0}];
      distributionX = [10000];
      distributionY = [10000];
      // If not fetched, keep activeIdDesired undefined to use current active on-chain
      // and set a conservative idSlippage of 0
      idSlippage = idSlippage || 0;
    }

    const {transactionRequest: txRequest} = await miraV2.addLiquidity(
      poolId,
      firstAssetAmount,
      secondAssetAmount,
      minAsset0Amount,
      minAsset1Amount,
      MaxDeadline,
      activeIdDesired,
      idSlippage,
      deltaIds,
      distributionX,
      distributionY,
      DefaultTxParams,
      {
        fundTransaction: true,
      }
    );

    const tx = await wallet.sendTransaction(txRequest);
    return await tx.waitForResult();
  }, [
    miraV2,
    readonlyMiraV2,
    wallet,
    poolId,
    firstAssetAmount,
    secondAssetAmount,
    slippage,
    liquidityDistribution,
  ]);

  const {data, mutateAsync, isPending, error} = useMutation({
    mutationFn,
  });

  return {data, mutateAsync, isPending, error};
}
