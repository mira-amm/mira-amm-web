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

/**
 * Determines the liquidity distribution shape based on bin positions
 * TODO: - remember to discuss this.
 */
function determineLiquidityShape(positions: V2BinPosition[]): LiquidityShape {
  if (positions.length === 0) return "curve";

  // Sort positions by binId for analysis
  const sortedPositions = [...positions].sort(
    (a, b) => Number(a.binId.toString()) - Number(b.binId.toString())
  );

  // Spot: 1-3 consecutive bins (very concentrated)
  if (positions.length <= 3) {
    const binIds = sortedPositions.map((p) => Number(p.binId.toString()));
    const isConsecutive = binIds.every(
      (id, i) => i === 0 || id === binIds[i - 1] + 1
    );
    if (isConsecutive) return "spot";
  }

  // Bid-Ask: Check for two separate clusters with significant gap
  if (positions.length >= 4) {
    const binIds = sortedPositions.map((p) => Number(p.binId.toString()));

    // Find the largest gap between consecutive bins
    let maxGap = 0;
    let maxGapIndex = 0;
    for (let i = 1; i < binIds.length; i++) {
      const gap = binIds[i] - binIds[i - 1];
      if (gap > maxGap) {
        maxGap = gap;
        maxGapIndex = i;
      }
    }

    // If there's a significant gap (more than 20% of total range), it's likely bid-ask
    const totalRange = binIds[binIds.length - 1] - binIds[0];
    if (maxGap > totalRange * 0.2 && maxGap > 5) {
      // Check both clusters have reasonable size
      const leftClusterSize = maxGapIndex;
      const rightClusterSize = positions.length - maxGapIndex;
      if (leftClusterSize >= 2 && rightClusterSize >= 2) {
        return "bidask";
      }
    }
  }

  // Default: Curve (continuous distribution)
  return "curve";
}

export interface V2BinPosition {
  binId: BN;
  lpToken: string; // AssetId as string
  lpTokenAmount: BN;
  underlyingAmounts: {x: BN; y: BN};
  underlyingAmountsDecimals?: {x: string; y: string}; // Decimal representation
  initialAmounts?: {x: BN; y: BN};
  initialAmountsDecimals?: {x: string; y: string}; // Decimal representation
  price: number;
  feesEarned: {x: BN; y: BN};
  isActive: boolean;
}

export type LiquidityShape = "spot" | "curve" | "bidask";

export interface V2PositionTotals {
  totalX: BN;
  totalY: BN;
  feesX: BN;
  feesY: BN;
  numBins: number;
  minPrice: number;
  maxPrice: number;
  liquidityShape: LiquidityShape;
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
                    reserveXDecimal
                    reserveYDecimal
                  }
                  liquidityShares
                  initialReserveX
                  initialReserveY
                  initialReservesXDecimals
                  initialReservesYDecimals
                  redeemableReserveX
                  redeemableReserveY
                  redeemableReservesXDecimals
                  redeemableReservesYDecimals
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
                  reserveXDecimal: string;
                  reserveYDecimal: string;
                };
                liquidityShares: string;
                initialReserveX: string;
                initialReserveY: string;
                initialReservesXDecimals: string;
                initialReservesYDecimals: string;
                redeemableReserveX: string;
                redeemableReserveY: string;
                redeemableReservesXDecimals: string;
                redeemableReservesYDecimals: string;
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
              // Calculate fees as difference between redeemable and initial reserves
              const redeemableX = new BN(binPosition.redeemableReserveX);
              const redeemableY = new BN(binPosition.redeemableReserveY);
              const initialX = new BN(binPosition.initialReserveX);
              const initialY = new BN(binPosition.initialReserveY);

              const feesX = redeemableX.sub(initialX);

              const feesY = redeemableY.sub(initialY);

              positions.push({
                binId: binPosition.bin.binId,
                lpToken: action.position.id, // NFT asset ID
                lpTokenAmount: new BN(binPosition.liquidityShares),
                underlyingAmounts: {
                  x: redeemableX,
                  y: redeemableY,
                },
                underlyingAmountsDecimals: {
                  x: binPosition.redeemableReservesXDecimals,
                  y: binPosition.redeemableReservesYDecimals,
                },
                initialAmounts: {
                  x: initialX,
                  y: initialY,
                },
                initialAmountsDecimals: {
                  x: binPosition.initialReservesXDecimals,
                  y: binPosition.initialReservesYDecimals,
                },
                price: parseFloat(binPosition.bin.price),
                feesEarned: {
                  x: feesX,
                  y: feesY,
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
        liquidityShape: "curve" as LiquidityShape,
      };
    }

    const aggregated = positions.reduce(
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

    // Determine liquidity shape based on bin distribution
    const liquidityShape = determineLiquidityShape(positions);

    return {
      ...aggregated,
      liquidityShape,
    };
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
