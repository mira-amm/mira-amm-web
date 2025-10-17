"use client";

import {useMutation} from "@tanstack/react-query";
import {useMiraDexV2, useReadonlyMiraV2} from "@/src/hooks";
import {useCallback} from "react";
import {useWallet} from "@fuels/react";
import {
  DEFAULT_SLIPPAGE_BASIS_POINT,
  DefaultTxParams,
  getMaxDeadlineV2,
} from "@/src/utils/constants";
import {bn, BN} from "fuels";
import type {
  LiquidityDistributionResult,
  DeltaIdDistribution,
} from "@/src/components/pages/add-liquidity-page/components/AddLiquidity/liquidityDistributionGenerator";
import {computeIdSlippageFromBps} from "@/src/components/pages/add-liquidity-page/components/AddLiquidity/liquidityDistributionUtils";

export function useAddLiquidityV2({
  poolId,
  firstAssetAmount,
  secondAssetAmount,
  slippage = DEFAULT_SLIPPAGE_BASIS_POINT, // 0.5% default slippage (basis points)
  liquidityDistribution,
  deltaDistribution,
}: {
  poolId: BN;
  firstAssetAmount: BN;
  secondAssetAmount: BN;
  slippage?: number;
  liquidityDistribution?: LiquidityDistributionResult;
  deltaDistribution?: DeltaIdDistribution;
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

    // Align desired active bin and id slippage with on-chain values to satisfy script checks
    const [chainActiveId, poolMeta] = await Promise.all([
      readonlyMiraV2?.getActiveBin(poolId),
      readonlyMiraV2?.poolMetadata(poolId),
    ]);

    // Prefer chain active bin to avoid InvalidIdSlippage reverts
    let activeIdDesired =
      chainActiveId ??
      (deltaDistribution?.activeIdDesired as unknown as number | undefined);

    // Normalize idSlippage using pool binStep and provided slippage bps
    let normalizedIdSlippage: number | undefined;
    let binStepBps: number | undefined = (poolMeta as any)?.pool?.binStep;
    // Handle BN-like values
    if (binStepBps && typeof (binStepBps as any).toNumber === "function") {
      binStepBps = (binStepBps as any).toNumber();
    }
    if (typeof binStepBps === "number") {
      normalizedIdSlippage = computeIdSlippageFromBps(binStepBps, slippage);
    }

    // Use provided idSlippage if any, but make sure it's not lower than normalized
    let idSlippage: number | undefined =
      deltaDistribution?.idSlippage as unknown as number | undefined;
    if (typeof normalizedIdSlippage === "number") {
      if (typeof idSlippage === "number") {
        idSlippage = Math.max(idSlippage, normalizedIdSlippage);
      } else {
        idSlippage = normalizedIdSlippage;
      }
    }

    // Final guard: ensure idSlippage covers the difference between desired and chain active id
    if (
      typeof chainActiveId === "number" &&
      typeof activeIdDesired === "number"
    ) {
      const diff = Math.abs(activeIdDesired - chainActiveId);
      if (typeof idSlippage !== "number" || diff > idSlippage) {
        idSlippage = diff;
      }
    }

    const deltaIds = deltaDistribution?.deltaIds;
    const distributionX = deltaDistribution?.distributionX;
    const distributionY = deltaDistribution?.distributionY;

    const {transactionRequest: txRequest} = await miraV2.addLiquidity(
      poolId,
      firstAssetAmount,
      secondAssetAmount,
      minAsset0Amount,
      minAsset1Amount,
      getMaxDeadlineV2(),
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
    deltaDistribution,
  ]);

  const {data, mutateAsync, isPending, error} = useMutation({
    mutationFn,
  });

  return {data, mutateAsync, isPending, error};
}
