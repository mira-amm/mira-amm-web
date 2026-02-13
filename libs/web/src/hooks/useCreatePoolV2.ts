"use client";
import {useCallback} from "react";
import {bn, BN} from "fuels";
import {useWallet} from "@fuels/react";
import {useMutation} from "@tanstack/react-query";
import {ACTIVE_BIN_ID} from "mira-dex-ts";

import {DefaultV2TxParams, getMaxDeadlineV2} from "@/src/utils/constants";
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
  const firstAssetMetadata = useAssetMetadata(firstAsset);
  const secondAssetMetadata = useAssetMetadata(secondAsset);

  const mutationFn = useCallback(async () => {
    if (!miraV2 || !wallet || !firstAsset || !secondAsset) {
      return;
    }

    // Validate that assets are different
    if (firstAsset === secondAsset) {
      throw new Error(
        "Cannot create a pool with identical assets. Please select two different assets."
      );
    }

    const firstCoinAmountToUse = bn.parseUnits(
      firstAssetAmount,
      firstAssetMetadata.decimals || 0
    );
    const secondCoinAmountToUse = bn.parseUnits(
      secondAssetAmount,
      secondAssetMetadata.decimals || 0
    );

    // Create pool input structure for v2 - use full asset IDs, not just contract IDs
    const poolInput = {
      assetX: {bits: firstAsset} as any,
      assetY: {bits: secondAsset} as any,
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
        getMaxDeadlineV2(),
        [
          {
            binId: activeBinIdUint.toNumber(), // Convert BN to number for LiquidityConfig
            distributionX: 100, // 100% of X tokens in active bin
            distributionY: 100, // 100% of Y tokens in active bin
          },
        ],
        DefaultV2TxParams,
        {
          fundTransaction: true,
        }
      );

    const tx = await wallet.sendTransaction(txRequest);
    return await tx.waitForResult();
  }, [
    miraV2,
    wallet,
    firstAsset,
    secondAsset,
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
