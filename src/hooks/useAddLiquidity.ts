import {useMutation} from "@tanstack/react-query";
import useMiraDex from "@/src/hooks/useMiraDex/useMiraDex";
import {CoinName, coinsConfig} from "@/src/utils/coinsConfig";
import {createPoolIdFromAssetNames} from "@/src/utils/common";
import {useCallback} from "react";
import {useWallet} from "@fuels/react";
import {DefaultTxParams, MaxDeadline} from "@/src/utils/constants";

type Props = {
  firstAssetName: CoinName;
  firstAssetAmount: string;
  secondAssetName: CoinName;
  secondAssetAmount: string;
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

    const firstCoinAmountToUse = parseFloat(firstAssetAmount) * 10 ** firstAsset.decimals!;
    const secondCoinAmountToUse = parseFloat(secondAssetAmount) * 10 ** secondAsset.decimals!;
    let asset0Amount;
    let asset1Amount;
    if (poolId[0].bits === firstAsset.assetId && poolId[1].bits === secondAsset.assetId) {
      asset0Amount = firstCoinAmountToUse;
      asset1Amount = secondCoinAmountToUse;
    } else if (poolId[0].bits === secondAsset.assetId && poolId[1].bits === firstAsset.assetId) {
      asset0Amount = secondCoinAmountToUse;
      asset1Amount = firstCoinAmountToUse;
    } else {
      throw new Error('Invalid pool id or asset configs');
    }

    const minAsset0Amount = asset0Amount * 0.99;
    const minAsset1Amount = asset1Amount * 0.99;
    const txRequest = await mira.addLiquidity(poolId, asset0Amount, asset1Amount, minAsset0Amount, minAsset1Amount, MaxDeadline, DefaultTxParams);
    const gasCost = await wallet.getTransactionCost(txRequest);
    const fundedTx = await wallet.fund(txRequest, gasCost);
    const tx = await wallet.sendTransaction(fundedTx, { estimateTxDependencies: true });
    return await tx.waitForResult();
  }, [mira, wallet, firstAssetName, secondAssetName, isPoolStable, firstAssetAmount, secondAssetAmount]);

  const { data, mutateAsync, isPending  } = useMutation({
    mutationFn,
  });

  return { data, mutateAsync, isPending };
};

export default useAddLiquidity;
