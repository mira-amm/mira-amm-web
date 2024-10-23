import {useMutation} from "@tanstack/react-query";
import useMiraDex from "@/src/hooks/useMiraDex/useMiraDex";
import {CoinName, coinsConfig} from "@/src/utils/coinsConfig";
import {createPoolIdFromAssetNames} from "@/src/utils/common";
import {useCallback} from "react";
import {useWallet} from "@fuels/react";
import {DefaultTxParams, MaxDeadline} from "@/src/utils/constants";
import {BN} from "fuels";

type Props = {
  firstAssetName: CoinName;
  firstAssetAmount: BN;
  secondAssetName: CoinName;
  secondAssetAmount: BN;
  isPoolStable: boolean;
};

const useAddLiquidity = ({ firstAssetName, firstAssetAmount, secondAssetName, secondAssetAmount, isPoolStable }: Props) => {
  const mira = useMiraDex();
  const { wallet } = useWallet();

  const mutationFn = useCallback(async () => {
    if (!mira || !wallet) {
      return;
    }

    const poolId = createPoolIdFromAssetNames(firstAssetName, secondAssetName, isPoolStable);
    const firstAsset = coinsConfig.get(firstAssetName)!;
    const secondAsset = coinsConfig.get(secondAssetName)!;

    let asset0Amount;
    let asset1Amount;
    if (poolId[0].bits === firstAsset.assetId && poolId[1].bits === secondAsset.assetId) {
      asset0Amount = firstAssetAmount;
      asset1Amount = secondAssetAmount;
    } else if (poolId[0].bits === secondAsset.assetId && poolId[1].bits === firstAsset.assetId) {
      asset0Amount = secondAssetAmount;
      asset1Amount = firstAssetAmount;
    } else {
      throw new Error('Invalid pool id or asset configs');
    }

    const minAsset0Amount = asset0Amount.mul(99).div(100);
    const minAsset1Amount = asset1Amount.mul(99).div(100);
    const txRequest = await mira.addLiquidity(poolId, asset0Amount, asset1Amount, minAsset0Amount, minAsset1Amount, MaxDeadline, DefaultTxParams);
    const gasCost = await wallet.getTransactionCost(txRequest);
    const fundedTx = await wallet.fund(txRequest, gasCost);
    const tx = await wallet.sendTransaction(fundedTx, { estimateTxDependencies: true });
    return await tx.waitForResult();
  }, [mira, wallet, firstAssetName, secondAssetName, isPoolStable, firstAssetAmount, secondAssetAmount]);

  const { data, mutateAsync, isPending, error  } = useMutation({
    mutationFn,
  });

  return { data, mutateAsync, isPending, error };
};

export default useAddLiquidity;
