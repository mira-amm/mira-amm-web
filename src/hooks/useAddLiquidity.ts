import {useMutation} from "@tanstack/react-query";
import useMiraDex from "@/src/hooks/useMiraDex/useMiraDex";
import {CoinName, coinsConfig} from "@/src/utils/coinsConfig";
import {createAssetIdInput} from "@/src/utils/common";
import {PoolId} from "mira-dex-ts";
import {useCallback} from "react";
import {useWallet} from "@fuels/react";
import {DefaultTxParams, MaxDeadline} from "@/src/utils/constants";

type Props = {
  firstCoin: CoinName;
  firstCoinAmount: string;
  secondCoin: CoinName;
  secondCoinAmount: string;
};

const useAddLiquidity = ({ firstCoin, firstCoinAmount, secondCoin, secondCoinAmount }: Props) => {
  const mira = useMiraDex();
  const { wallet } = useWallet();

  const mutationFn = useCallback(async () => {
    if (!mira || !wallet) {
      return;
    }

    const firstCoinAssetIdInput = createAssetIdInput(firstCoin);
    const secondCoinAssetIdInput = createAssetIdInput(secondCoin);

    const poolId: PoolId = [firstCoinAssetIdInput, secondCoinAssetIdInput, false];

    const firstCoinAmountToUse = parseFloat(firstCoinAmount) * 10 ** coinsConfig.get(firstCoin)?.decimals!;
    const secondCoinAmountToUse = parseFloat(secondCoinAmount) * 10 ** coinsConfig.get(secondCoin)?.decimals!;

    const txRequest = await mira.addLiquidity(poolId, firstCoinAmountToUse, secondCoinAmountToUse, 0, 0, MaxDeadline, DefaultTxParams);
    const gasCost = await wallet.getTransactionCost(txRequest);
    const tx = await wallet.fund(txRequest, gasCost);
    return await wallet.sendTransaction(tx);
  }, [mira, wallet, firstCoin, secondCoin, firstCoinAmount, secondCoinAmount]);

  const { data, mutateAsync, isPending  } = useMutation({
    mutationFn,
  });

  return { data, mutateAsync, isPending };
};

export default useAddLiquidity;
