import {useMutation} from "@tanstack/react-query";
import useMiraDex from "@/src/hooks/useMiraDex/useMiraDex";
import {useCallback} from "react";
import {useWallet} from "@fuels/react";
import {DefaultTxParams, MaxDeadline} from "@/src/utils/constants";
import {bn, BN} from "fuels";
import {buildPoolId} from "mira-dex-ts";

type Props = {
  firstAsset: string;
  firstAssetAmount: BN;
  secondAsset: string;
  secondAssetAmount: BN;
  isPoolStable: boolean;
  slippage: number;
};

const useAddLiquidity = ({
  firstAsset,
  firstAssetAmount,
  secondAsset,
  secondAssetAmount,
  isPoolStable,
  slippage,
}: Props) => {
  const mira = useMiraDex();
  const {wallet} = useWallet();

  const mutationFn = useCallback(async () => {
    if (!mira || !wallet) {
      return;
    }

    const poolId = buildPoolId(firstAsset, secondAsset, isPoolStable);

    let asset0Amount;
    let asset1Amount;
    if (poolId[0].bits === firstAsset && poolId[1].bits === secondAsset) {
      asset0Amount = firstAssetAmount;
      asset1Amount = secondAssetAmount;
    } else if (
      poolId[0].bits === secondAsset &&
      poolId[1].bits === firstAsset
    ) {
      asset0Amount = secondAssetAmount;
      asset1Amount = firstAssetAmount;
    } else {
      throw new Error("Invalid pool id or asset configs");
    }

    const minAsset0Amount = asset0Amount
      .mul(bn(10_000).sub(bn(slippage)))
      .div(bn(10_000));

    const minAsset1Amount = asset1Amount
      .mul(bn(10_000).sub(bn(slippage)))
      .div(bn(10_000));

    const txRequest = await mira.addLiquidity(
      poolId,
      asset0Amount,
      asset1Amount,
      minAsset0Amount,
      minAsset1Amount,
      MaxDeadline,
      DefaultTxParams,
    );
    const gasCost = await wallet.getTransactionCost(txRequest);
    const fundedTx = await wallet.fund(txRequest, gasCost);
    const tx = await wallet.sendTransaction(fundedTx, {
      estimateTxDependencies: true,
    });
    return await tx.waitForResult();
  }, [
    mira,
    wallet,
    firstAsset,
    secondAsset,
    isPoolStable,
    firstAssetAmount,
    secondAssetAmount,
    slippage,
  ]);

  const {data, mutateAsync, isPending, error} = useMutation({
    mutationFn,
  });

  return {data, mutateAsync, isPending, error};
};

export default useAddLiquidity;
