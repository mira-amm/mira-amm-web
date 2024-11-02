import useMiraDex from "@/src/hooks/useMiraDex/useMiraDex";
import {useMutation, useQuery} from "@tanstack/react-query";
import {useWallet} from "@fuels/react";
import {useCallback} from "react";
import {CoinName, coinsConfig} from "@/src/utils/coinsConfig";
import {DefaultTxParams, MaxDeadline} from "@/src/utils/constants";
import {bn, BN} from "fuels";

type Props = {
  firstAssetName: CoinName;
  firstAssetAmount: string;
  secondAssetName: CoinName;
  secondAssetAmount: string;
  isPoolStable: boolean;
};

const useCreatePool = ({ firstAssetName, firstAssetAmount, secondAssetName, secondAssetAmount, isPoolStable }: Props) => {
  const mira = useMiraDex();
  const { wallet } = useWallet();

  const mutationFn = useCallback(async () => {
    if (!mira || !wallet) {
      return;
    }

    const firstAssetContractId = coinsConfig.get(firstAssetName)?.contractId ?? '';
    const secondAssetContractId = coinsConfig.get(secondAssetName)?.contractId ?? '';

    const firstAssetSubId = coinsConfig.get(firstAssetName)?.subId ?? '';
    const secondAssetSubId = coinsConfig.get(secondAssetName)?.subId ?? '';

    const firstAssetDecimals = coinsConfig.get(firstAssetName)?.decimals ?? 0;
    const secondAssetDecimals = coinsConfig.get(secondAssetName)?.decimals ?? 0;

    const firstCoinAmountToUse = bn.parseUnits(firstAssetAmount, firstAssetDecimals);
    const secondCoinAmountToUse = bn.parseUnits(secondAssetAmount, secondAssetDecimals);

    const txRequest = await mira.createPoolAndAddLiquidity(
      firstAssetContractId,
      firstAssetSubId,
      secondAssetContractId,
      secondAssetSubId,
      isPoolStable,
      firstCoinAmountToUse,
      secondCoinAmountToUse,
      MaxDeadline,
      DefaultTxParams,
    );
    const gasCost = await wallet.getTransactionCost(txRequest);
    const fundedTx = await wallet.fund(txRequest, gasCost);
    const tx = await wallet.sendTransaction(fundedTx);
    return await tx.waitForResult();
  }, [
    mira,
    wallet,
    firstAssetName,
    secondAssetName,
    firstAssetAmount,
    secondAssetAmount,
    isPoolStable,
  ]);

  const { data, mutateAsync, isPending } = useMutation({
    mutationFn,
  });

  return { createPoolData: data, createPool: mutateAsync, isPoolCreationPending: isPending };
};

export default useCreatePool;
