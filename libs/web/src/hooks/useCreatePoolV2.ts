"use client";
import {useCallback} from "react";
import {bn, BN} from "fuels";
import {useWallet} from "@fuels/react";
import {useMutation} from "@tanstack/react-query";
import {ACTIVE_BIN_ID} from "mira-dex-ts";

import {DefaultTxParams, getMaxDeadline} from "@/src/utils/constants";
import {useAssetMinterContract} from "./useAssetMinterContract";
import {useAssetMetadata, useMiraDexV2} from "@/src/hooks";

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
  const miraV2 = useMiraDexV2();
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

    // Calculate active bin ID (starting at the middle bin) - unsigned representation
    // Use center bin constant from SDK, matches REAL_ID_SHIFT in Sway contract
    const activeBinIdUint = new BN(ACTIVE_BIN_ID.CENTER); // Center bin in unsigned representation

    // Create the pool and add initial liquidity
    const {transactionRequest: txRequest} =
      await miraV2.createPoolAndAddLiquidity(
        poolInput,
        activeBinIdUint,
        firstCoinAmountToUse,
        secondCoinAmountToUse,
        getMaxDeadline(),
        [
          {
            binId: activeBinIdUint.toNumber(), // Convert BN to number for LiquidityConfig
            distributionX: 100, // 100% of X tokens in active bin
            distributionY: 100, // 100% of Y tokens in active bin
          },
        ],
        DefaultTxParams,
        {
          reserveGas: 10000,
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
