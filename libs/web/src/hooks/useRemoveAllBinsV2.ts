"use client";

import {useMutation, useQueryClient} from "@tanstack/react-query";
import {useMiraDexV2} from "@/src/hooks";
import {useCallback} from "react";
import {useWallet} from "@fuels/react";
import {DefaultTxParams, getMaxDeadlineV2} from "@/src/utils/constants";
import {bn, BN} from "fuels";
import {V2BinPosition} from "./useUserBinPositionsV2";
import {isV2MockEnabled, mockRemoveLiquidityV2} from "../utils/mockConfig";

export interface RemoveAllBinsV2Params {
  poolId: BN;
  userPositions: V2BinPosition[];
  slippage: number;
}

export function useRemoveAllBinsV2({
  poolId,
  userPositions,
  slippage,
}: RemoveAllBinsV2Params) {
  const miraV2 = useMiraDexV2();
  const {wallet} = useWallet();
  const queryClient = useQueryClient();

  const mutationFn = useCallback(async () => {
    // Mock mode for testing without contracts
    if (isV2MockEnabled()) {
      const binIds = userPositions.map((pos) => pos.binId.toNumber());
      const totalLiquidity = userPositions.reduce(
        (total, pos) => ({
          x: total.x.add(pos.underlyingAmounts.x),
          y: total.y.add(pos.underlyingAmounts.y),
        }),
        {x: new BN(0), y: new BN(0)}
      );

      const result = await mockRemoveLiquidityV2({
        poolId: poolId.toString(),
        binIds,
        amounts: totalLiquidity,
      });

      // Simulate successful removal
      queryClient.invalidateQueries({
        queryKey: ["userBinPositionsV2", poolId.toString()],
      });

      return {
        id: result.transactionId,
        status: "success",
        gasUsed: new BN(100000),
      };
    }

    if (!miraV2 || !wallet || userPositions.length === 0) {
      return;
    }

    // IMPORTANT: Mira V2 uses Position NFTs, not per-bin LP tokens
    // When you add liquidity to multiple bins, you get ONE position NFT that represents
    // ownership of shares across all those bins. Multiple bins can share the same position NFT.
    // We need to deduplicate before calling removeLiquidity.
    const positionNFTs = new Set(userPositions.map((p) => p.lpToken));
    const uniqueLpTokens = Array.from(positionNFTs);

    // Calculate total expected underlying amounts across all bins
    const totalUnderlyingX = userPositions.reduce(
      (total, position) => total.add(position.underlyingAmounts.x),
      new BN(0)
    );

    const totalUnderlyingY = userPositions.reduce(
      (total, position) => total.add(position.underlyingAmounts.y),
      new BN(0)
    );

    // Apply slippage protection to minimum amounts
    // Slippage is in basis points (e.g., 50 = 0.5%)
    const minAmountX = totalUnderlyingX
      .mul(bn(10_000).sub(bn(slippage)))
      .div(bn(10_000));

    const minAmountY = totalUnderlyingY
      .mul(bn(10_000).sub(bn(slippage)))
      .div(bn(10_000));

    try {
      const {transactionRequest: txRequest} = await miraV2.removeLiquidity(
        poolId,
        uniqueLpTokens, // Position NFT IDs (deduplicated)
        minAmountX,
        minAmountY,
        getMaxDeadlineV2(),
        DefaultTxParams,
        {
          fundTransaction: true,
        }
      );

      const tx = await wallet.sendTransaction(txRequest);
      const result = await tx.waitForResult();

      // Invalidate user positions query to refresh data
      queryClient.invalidateQueries({
        queryKey: ["userBinPositionsV2", poolId.toString()],
      });

      return result;
    } catch (error) {
      console.error("❌ Remove liquidity failed:", error);
      throw error;
    }
  }, [miraV2, wallet, userPositions, poolId, slippage, queryClient]);

  const {data, mutateAsync, isPending, error} = useMutation({
    mutationFn,
  });

  return {data, mutateAsync, isPending, error};
}
