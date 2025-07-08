"use client";
import {useCallback} from "react";
import {bn} from "fuels";
import {useWallet} from "@fuels/react";
import {useMutation} from "@tanstack/react-query";

import {DefaultTxParams, MaxDeadline} from "@/src/utils/constants";
import {useAssetMinterContract} from "./useAssetMinterContract";
import {useAssetMetadata, useMiraDex} from "@/src/hooks";

export function useCreatePool({
  firstAsset,
  firstAssetAmount,
  secondAsset,
  secondAssetAmount,
  isPoolStable,
}: {
  firstAsset: string;
  firstAssetAmount: string;
  secondAsset: string;
  secondAssetAmount: string;
  isPoolStable: boolean;
}) {
  const mira = useMiraDex();
  const {wallet} = useWallet();
  const firstAssetContract = useAssetMinterContract(firstAsset);
  const secondAssetContract = useAssetMinterContract(secondAsset);
  const firstAssetMetadata = useAssetMetadata(firstAsset);
  const secondAssetMetadata = useAssetMetadata(secondAsset);

  const mutationFn = useCallback(async () => {
    if (
      !mira ||
      !wallet ||
      !firstAssetContract.contractId ||
      !secondAssetContract.contractId ||
      !firstAssetContract.subId ||
      !secondAssetContract.subId
    ) {
      return;
    }

    const firstCoinAmountToUse = bn.parseUnits(
      firstAssetAmount,
      firstAssetMetadata.decimals || 0
    );
    const secondCoinAmountToUse = bn.parseUnits(
      secondAssetAmount,
      secondAssetMetadata.decimals || 0
    );

    const {transactionRequest: txRequest} =
      await mira.createPoolAndAddLiquidity(
        firstAssetContract.contractId,
        firstAssetContract.subId,
        secondAssetContract.contractId,
        secondAssetContract.subId,
        isPoolStable,
        firstCoinAmountToUse,
        secondCoinAmountToUse,
        MaxDeadline,
        DefaultTxParams,
        {
          useAssembleTx: true,
        },
      );
    const tx = await wallet.sendTransaction(txRequest);
    return await tx.waitForResult();
  }, [
    mira,
    wallet,
    firstAssetContract,
    secondAssetContract,
    firstAssetMetadata,
    secondAssetMetadata,
    firstAssetAmount,
    secondAssetAmount,
    isPoolStable,
  ]);

  const {data, mutateAsync, isPending} = useMutation({
    mutationFn,
  });

  return {
    createPoolData: data,
    createPool: mutateAsync,
    isPoolCreationPending: isPending,
  };
}
