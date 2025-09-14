"use client";

import {useMutation} from "@tanstack/react-query";
import {useMiraSDK} from "@/src/core/providers/MiraSDKProvider";
import {useCallback} from "react";
import {useWallet} from "@fuels/react";
import {
  DEFAULT_SLIPPAGE_BASIS_POINT,
  DefaultTxParams,
  MaxDeadline,
} from "@/src/utils/constants";
import {bn, BN} from "fuels";
import type {
  LiquidityDistributionResult,
  DeltaIdDistribution,
} from "@/src/components/pages/add-liquidity-page/components/AddLiquidity/liquidityDistributionGenerator";

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
  const {miraV2, readonlyMiraV2} = useMiraSDK();
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

    const activeIdDesired = deltaDistribution?.activeIdDesired;
    const idSlippage = deltaDistribution?.idSlippage;
    const deltaIds = deltaDistribution?.deltaIds;
    const distributionX = deltaDistribution?.distributionX;
    const distributionY = deltaDistribution?.distributionY;

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
    deltaDistribution,
  ]);

  const {data, mutateAsync, isPending, error} = useMutation({
    mutationFn,
  });

  return {data, mutateAsync, isPending, error};
}
