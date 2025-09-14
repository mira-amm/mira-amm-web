"use client";

import {useMutation} from "@tanstack/react-query";
import {useMiraSDK} from "@/src/core/providers/MiraSDKProvider";
import {useCallback} from "react";
import {useWallet} from "@fuels/react";
import {DefaultTxParams, MaxDeadline} from "@/src/utils/constants";
import {bn, BN} from "fuels";

export interface RemoveLiquidityV2Params {
  poolId: BN;
  binIds: BN[];
  amounts: BN[];
  minAmountX: BN;
  minAmountY: BN;
  slippage: number;
}

export function useRemoveLiquidityV2({
  poolId,
  binIds,
  amounts,
  minAmountX,
  minAmountY,
  slippage,
}: RemoveLiquidityV2Params) {
  const {miraV2} = useMiraSDK();
  const {wallet} = useWallet();

  const mutationFn = useCallback(async () => {
    if (!miraV2 || !wallet) {
      return;
    }

    // Apply slippage protection to minimum amounts
    const adjustedMinAmountX = minAmountX
      .mul(bn(10_000).sub(bn(slippage)))
      .div(bn(10_000));

    const adjustedMinAmountY = minAmountY
      .mul(bn(10_000).sub(bn(slippage)))
      .div(bn(10_000));

    // Remove liquidity from specified bins
    const {transactionRequest: txRequest} = await miraV2.removeLiquidity(
      poolId,
      binIds,
      amounts,
      adjustedMinAmountX,
      adjustedMinAmountY,
      MaxDeadline,
      DefaultTxParams,
      {
        useAssembleTx: true,
      }
    );

    const tx = await wallet.sendTransaction(txRequest);
    return await tx.waitForResult();
  }, [
    miraV2,
    wallet,
    poolId,
    binIds,
    amounts,
    minAmountX,
    minAmountY,
    slippage,
  ]);

  const {data, mutateAsync, isPending, error} = useMutation({
    mutationFn,
  });

  return {data, mutateAsync, isPending, error};
}
