"use client";
import {useCallback} from "react";
import {bn, BN} from "fuels";
import {useWallet} from "@fuels/react";
import {useMutation} from "@tanstack/react-query";
import {useMiraDex} from "@/src/hooks/useMiraDex";
import {PoolId} from "mira-dex-ts";
import {DefaultTxParams, MaxDeadline} from "@/src/utils/constants";

export function useRemoveLiquidity({
  pool,
  liquidityPercentage,
  lpTokenBalance,
  coinAAmountToWithdraw,
  coinBAmountToWithdraw,
  slippageBps = 100,
}: {
  pool: PoolId;
  liquidityPercentage: number;
  lpTokenBalance: BN | undefined;
  coinAAmountToWithdraw: BN;
  coinBAmountToWithdraw: BN;
  slippageBps?: number;
}) {
  const mira = useMiraDex();
  const {wallet} = useWallet();

  const mutationFn = useCallback(async () => {
    if (!mira || !wallet || !lpTokenBalance) {
      return;
    }

    const liquidityAmount = lpTokenBalance
      .mul(new BN(liquidityPercentage))
      .div(new BN(100));

    const minMultiplierBps = Math.max(0, 10_000 - slippageBps);
    const minCoinAAmount = coinAAmountToWithdraw
      .mul(bn(minMultiplierBps))
      .div(bn(10_000));
    const minCoinBAmount = coinBAmountToWithdraw
      .mul(bn(minMultiplierBps))
      .div(bn(10_000));

    const {transactionRequest: txRequest} = await mira.removeLiquidity(
      pool,
      liquidityAmount,
      minCoinAAmount,
      minCoinBAmount,
      MaxDeadline,
      DefaultTxParams,
      {
        useAssembleTx: true,
        reserveGas: 10000,
      }
    );

    const tx = await wallet.sendTransaction(txRequest);
    await tx.waitForResult();
    return tx;
  }, [
    mira,
    wallet,
    pool,
    liquidityPercentage,
    lpTokenBalance,
    coinAAmountToWithdraw,
    coinBAmountToWithdraw,
    slippageBps,
  ]);

  const {data, mutateAsync, error, isPending} = useMutation({
    mutationFn,
  });

  return {
    data,
    removeLiquidity: mutateAsync,
    error,
    isPending,
  };
}
