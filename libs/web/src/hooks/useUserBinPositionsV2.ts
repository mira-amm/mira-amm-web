"use client";

import {useQuery} from "@tanstack/react-query";
import {useReadonlyMiraV2} from "@/src/hooks";
import {BN} from "fuels";
import {useWallet} from "@fuels/react";
import request, {gql} from "graphql-request";
import {useMemo} from "react";
import {SQDIndexerUrl} from "../utils/constants";
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

export interface V2PositionTotals {
  totalX: BN;
  totalY: BN;
  feesX: BN;
  feesY: BN;
  numBins: number;
  minPrice: number;
  maxPrice: number;
}

export function useUserBinPositionsV2(poolId: BN | undefined) {
  const readonlyMiraV2 = useReadonlyMiraV2();
  const {wallet} = useWallet();

  const userAddress = wallet?.address;

  const query = useQuery({
    queryKey: [
      "userBinPositionsV2",
      poolId?.toString(),
      userAddress?.toString(),
    ],
    queryFn: async () => {
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
        // Query the indexer for user's positions in this pool
        const query = gql`
          query GetUserPositions($poolId: String!, $userAddress: String!) {
            actions(
              where: {
                type_eq: ADD_LIQUIDITY_V2
                pool: {id_eq: $poolId}
                recipient_eq: $userAddress
              }
              orderBy: timestamp_DESC
            ) {
              id
              position {
                id
                binPositions(where: {bin: {pool: {id_eq: $poolId}}}) {
                  bin {
                    binId
                    isActive
                    price
                  }
                  liquidityShares
                  redeemableReserveX
                  redeemableReserveY
                  feesX
                  feesY
                }
              }
            }
          }
        `;

        const result = await request<{
          actions: Array<{
            id: string;
            position: {
              id: string;
              binPositions: Array<{
                bin: {
                  binId: number;
                  isActive: boolean;
                  price: string;
                };
                liquidityShares: string;
                redeemableReserveX: string;
                redeemableReserveY: string;
                feesX: string;
                feesY: string;
              }>;
            };
          }>;
        }>({
          url: SQDIndexerUrl,
          document: query,
          variables: {
            poolId: poolId.toString(),
            userAddress: userAddress.toString().toLowerCase(),
          },
        });

        console.log("Indexer query result:", result);

        // Transform indexer data to V2BinPosition format
        const positions: any[] = [];
        const seenBins = new Set<number>();

        for (const action of result.actions) {
          if (!action.position) continue;

          for (const binPosition of action.position.binPositions) {
            // Skip if we've already seen this bin (in case of multiple actions)
            if (seenBins.has(binPosition.bin.binId)) continue;
            seenBins.add(binPosition.bin.binId);

            // Only include bins with non-zero liquidity
            if (new BN(binPosition.liquidityShares).gt(0)) {
              positions.push({
                binId: binPosition.bin.binId,
                lpToken: action.position.id, // NFT asset ID
                lpTokenAmount: new BN(binPosition.liquidityShares),
                underlyingAmounts: {
                  x: new BN(binPosition.redeemableReserveX),
                  y: new BN(binPosition.redeemableReserveY),
                },
                price: parseFloat(binPosition.bin.price),
                feesEarned: {
                  x: new BN(binPosition.feesX),
                  y: new BN(binPosition.feesY),
                },
                isActive: binPosition.bin.isActive,
              });
            }
          }
        }

        return positions;
      } catch (error) {
        console.error("Failed to fetch user bin positions:", error);
        throw error;
      }
    },
    enabled: Boolean(readonlyMiraV2 && poolId && userAddress),
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // Refetch every minute
  });

  // Calculate totals from positions
  const totals: V2PositionTotals = useMemo(() => {
    const positions = query.data;

    if (!positions || positions.length === 0) {
      return {
        totalX: new BN(0),
        totalY: new BN(0),
        feesX: new BN(0),
        feesY: new BN(0),
        numBins: 0,
        minPrice: 0,
        maxPrice: 0,
      };
    }

    return positions.reduce(
      (acc, position) => ({
        totalX: acc.totalX.add(position.underlyingAmounts.x),
        totalY: acc.totalY.add(position.underlyingAmounts.y),
        feesX: acc.feesX.add(position.feesEarned.x),
        feesY: acc.feesY.add(position.feesEarned.y),
        numBins: acc.numBins + 1,
        minPrice: Math.min(acc.minPrice, position.price),
        maxPrice: Math.max(acc.maxPrice, position.price),
      }),
      {
        totalX: new BN(0),
        totalY: new BN(0),
        feesX: new BN(0),
        feesY: new BN(0),
        numBins: 0,
        minPrice: Infinity,
        maxPrice: -Infinity,
      }
    );
  }, [query.data]);

  return {
    ...query,
    totals,
  };
}

// Hook to get total position value across all bins
// export function useUserTotalPositionV2(poolId: BN | undefined) {
//   const {data: positions, ...rest} = useUserBinPositionsV2(poolId);

//   const totalValue = positions?.reduce(
//     (total, position) => ({
//       x: total.x.add(position.underlyingAmounts.x),
//       y: total.y.add(position.underlyingAmounts.y),
//     }),
//     {x: new BN(0), y: new BN(0)}
//   ) || {x: new BN(0), y: new BN(0)};

//   const totalFeesEarned = positions?.reduce(
//     (total, position) => ({
//       x: total.x.add(position.feesEarned.x),
//       y: total.y.add(position.feesEarned.y),
//     }),
//     {x: new BN(0), y: new BN(0)}
//   ) || {x: new BN(0), y: new BN(0)};

//   return {
//     ...rest,
//     data: positions,
//     totalValue,
//     totalFeesEarned,
//     hasPositions: (positions?.length || 0) > 0,
//   };
// }
