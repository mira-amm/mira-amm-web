"use client";

import {useQuery} from "@tanstack/react-query";
import {useMiraSDK} from "@/src/core/providers/MiraSDKProvider";
import {BN, Address} from "fuels";
import {useWallet} from "@fuels/react";
import {
  isV2MockEnabled,
  getMockUserPositions,
  mockDelay,
} from "../utils/mockConfig";

export interface V2BinPosition {
  binId: BN;
  lpToken: string; // AssetId as string
  lpTokenAmount: BN;
  underlyingAmounts: {x: BN; y: BN};
  price: number;
  feesEarned: {x: BN; y: BN};
  isActive: boolean;
}

export function useUserBinPositionsV2(poolId: BN | undefined) {
  const {readonlyMiraV2} = useMiraSDK();
  const {wallet} = useWallet();

  const userAddress = wallet?.address;

  return useQuery({
    queryKey: [
      "userBinPositionsV2",
      poolId?.toString(),
      userAddress?.toString(),
    ],
    queryFn: async (): Promise<V2BinPosition[]> => {
      // Mock mode for testing without contracts
      if (isV2MockEnabled()) {
        await mockDelay("fetchPositions");
        const mockPositions = getMockUserPositions(
          poolId?.toString() || "1001"
        );

        return mockPositions.map((position) => ({
          binId: new BN(position.binId),
          lpToken: `mock-lp-token-${position.binId}`,
          lpTokenAmount: new BN(position.lpTokenAmount),
          underlyingAmounts: {
            x: new BN(position.underlyingAmounts.x),
            y: new BN(position.underlyingAmounts.y),
          },
          price: position.price,
          feesEarned: {
            x: new BN(position.feesEarned.x),
            y: new BN(position.feesEarned.y),
          },
          isActive: position.isActive,
        }));
      }

      if (!readonlyMiraV2 || !poolId || !userAddress) {
        return [];
      }

      try {
        // Get user's bin positions from the v2 SDK
        const positions = await readonlyMiraV2.getUserBinPositions(
          poolId,
          Address.fromString(userAddress.toString())
        );

        // Get the active bin to determine which positions are active
        const activeBinId = await readonlyMiraV2.getActiveBin(poolId);

        // Transform the positions to our interface format
        const transformedPositions: V2BinPosition[] = positions.map(
          (position) => ({
            binId: new BN(position.binId),
            lpToken: position.lpToken?.bits || "unknown", // Convert AssetId to string
            lpTokenAmount: position.lpTokenAmount,
            underlyingAmounts: position.underlyingAmounts,
            price: position.price || 0,
            feesEarned: position.feesEarned || {x: new BN(0), y: new BN(0)},
            isActive: new BN(position.binId).eq(activeBinId),
          })
        );

        return transformedPositions;
      } catch (error) {
        console.error("Failed to fetch user bin positions:", error);
        return [];
      }
    },
    enabled: Boolean(
      isV2MockEnabled() || (readonlyMiraV2 && poolId && userAddress)
    ),
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // Refetch every minute
  });
}

// Hook to get total position value across all bins
export function useUserTotalPositionV2(poolId: BN | undefined) {
  const {data: positions, ...rest} = useUserBinPositionsV2(poolId);

  const totalValue = positions?.reduce(
    (total, position) => ({
      x: total.x.add(position.underlyingAmounts.x),
      y: total.y.add(position.underlyingAmounts.y),
    }),
    {x: new BN(0), y: new BN(0)}
  ) || {x: new BN(0), y: new BN(0)};

  const totalFeesEarned = positions?.reduce(
    (total, position) => ({
      x: total.x.add(position.feesEarned.x),
      y: total.y.add(position.feesEarned.y),
    }),
    {x: new BN(0), y: new BN(0)}
  ) || {x: new BN(0), y: new BN(0)};

  return {
    ...rest,
    data: positions,
    totalValue,
    totalFeesEarned,
    hasPositions: (positions?.length || 0) > 0,
  };
}
