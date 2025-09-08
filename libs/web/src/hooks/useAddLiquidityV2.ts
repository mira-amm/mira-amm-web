"use client";

import {useMutation} from "@tanstack/react-query";
import {useMiraDexV2} from "@/src/hooks";
import {useCallback} from "react";
import {useWallet} from "@fuels/react";
import {DefaultTxParams, MaxDeadline} from "@/src/utils/constants";
import {bn, BN} from "fuels";

export function useAddLiquidityV2({
  poolId,
  firstAssetAmount,
  secondAssetAmount,
  slippage = 50, // 0.5% default slippage
}: {
  poolId: BN;
  firstAssetAmount: BN;
  secondAssetAmount: BN;
  slippage?: number;
}) {
  const miraV2 = useMiraDexV2();
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

    // Single active bin configuration - equivalent to v1 behavior
    // All liquidity goes to the active bin (current price)
    const deltaIds = [{Positive: 0}]; // Only active bin (0 offset)
    const distributionX = [100]; // 100% of X tokens to active bin
    const distributionY = [100]; // 100% of Y tokens to active bin
    const activeIdDesired = undefined; // Use current active bin
    const idSlippage = 0; 

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
        useAssembleTx: true,
      }
    );

    const tx = await wallet.sendTransaction(txRequest);
    return await tx.waitForResult();
  }, [miraV2, wallet, poolId, firstAssetAmount, secondAssetAmount, slippage]);

  const {data, mutateAsync, isPending, error} = useMutation({
    mutationFn,
  });

  return {data, mutateAsync, isPending, error};
}
