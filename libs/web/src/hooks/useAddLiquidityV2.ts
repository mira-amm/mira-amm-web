"use client";

import {useMutation} from "@tanstack/react-query";
import {useMiraDexV2, useReadonlyMiraV2} from "@/src/hooks";
import {useCallback} from "react";
import {useWallet} from "@fuels/react";
import {DefaultTxParams, MaxDeadline} from "@/src/utils/constants";
import {bn, BN} from "fuels";
import type {LiquidityDistributionResult} from "@/src/components/pages/add-liquidity-page/components/AddLiquidity/liquidityDistributionGenerator";
import {generateDeltaIdDistribution} from "@/src/components/pages/add-liquidity-page/components/AddLiquidity/liquidityDistributionGenerator";

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
    let binStepBps: number | undefined = undefined;
    if (readonlyMiraV2) {
      const [activeId, metadata] = await Promise.all([
        readonlyMiraV2.getActiveBin(poolId),
        readonlyMiraV2.poolMetadata(poolId),
      ]);
      if (activeId !== null) {
        activeIdDesired = activeId;
      }
      if (metadata) {
        binStepBps = metadata.pool.binStep; // e.g., 25 -> 0.25%
      }
    }

    const gen = generateDeltaIdDistribution({
      liquidityDistribution,
      chainActiveId: activeIdDesired,
      slippageBps: slippage,
      binStepBps,
    });
    const deltaIds = gen.data.deltaIds ?? [{Positive: 0}];
    const distributionX = (gen.data.distributionX as number[]) ?? [10000];
    const distributionY = (gen.data.distributionY as number[]) ?? [10000];
    const idSlippageForCall =
      (gen.data.idSlippage as number | undefined) ?? idSlippage;

    const {transactionRequest: txRequest} = await miraV2.addLiquidity(
      poolId,
      firstAssetAmount,
      secondAssetAmount,
      minAsset0Amount,
      minAsset1Amount,
      MaxDeadline,
      activeIdDesired,
      idSlippageForCall,
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
