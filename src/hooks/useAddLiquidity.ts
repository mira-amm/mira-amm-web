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

    const firstCoinAmountToUse = parseFloat(firstAssetAmount) * 10 ** coinsConfig.get(firstAssetName)?.decimals!;
    const secondCoinAmountToUse = parseFloat(secondAssetAmount) * 10 ** coinsConfig.get(secondAssetName)?.decimals!;

    const txRequest = await mira.addLiquidity(poolId, firstCoinAmountToUse, secondCoinAmountToUse, 0, 0, MaxDeadline, DefaultTxParams);
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
