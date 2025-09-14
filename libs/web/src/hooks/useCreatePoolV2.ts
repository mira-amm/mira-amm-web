"use client";
import {useCallback} from "react";
import {bn, BN} from "fuels";
import {useWallet} from "@fuels/react";
import {useMutation} from "@tanstack/react-query";

import {DefaultTxParams, MaxDeadline} from "@/src/utils/constants";
import {useAssetMinterContract} from "./useAssetMinterContract";
import {useAssetMetadata} from "@/src/hooks";
import {useMiraSDK} from "@/src/core/providers/MiraSDKProvider";

export function useCreatePoolV2({
  firstAsset,
  firstAssetAmount,
  secondAsset,
  secondAssetAmount,
  binStep,
  baseFactor,
}: {
  firstAsset: string;
  firstAssetAmount: string;
  secondAsset: string;
  secondAssetAmount: string;
  binStep: number;
  baseFactor: number;
}) {
  const {miraV2} = useMiraSDK();
  const {wallet} = useWallet();
  const firstAssetContract = useAssetMinterContract(firstAsset);
  const secondAssetContract = useAssetMinterContract(secondAsset);
  const firstAssetMetadata = useAssetMetadata(firstAsset);
  const secondAssetMetadata = useAssetMetadata(secondAsset);

  const mutationFn = useCallback(async () => {
    if (
      !miraV2 ||
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

    // Create pool input structure for v2
    const poolInput = {
      assetX: {bits: firstAssetContract.contractId} as any,
      assetY: {bits: secondAssetContract.contractId} as any,
      binStep: new BN(binStep),
      baseFactor: new BN(baseFactor),
    };

    // Calculate active bin ID (starting at the middle bin)
    const activeId = new BN("8388608"); // 2^23, middle bin

    // Create the pool and add initial liquidity
    const {transactionRequest: txRequest} =
      await miraV2.createPoolAndAddLiquidity(
        poolInput,
        activeId,
        [
          {
            binId: activeId,
            amountX: firstCoinAmountToUse,
            amountY: secondCoinAmountToUse,
          },
        ],
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
    firstAssetContract,
    secondAssetContract,
    firstAssetMetadata,
    secondAssetMetadata,
    firstAssetAmount,
    secondAssetAmount,
    binStep,
    baseFactor,
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
