"use client";

import {useQuery} from "@tanstack/react-query";
import {useReadonlyMiraV2, useBalances} from "@/src/hooks";
import {BN} from "fuels";
import {useWallet} from "@fuels/react";
import request, {gql} from "graphql-request";
import {SQDIndexerUrl} from "@/src/utils/constants";
import type {V2BinPosition} from "./useUserBinPositionsV2";

export interface V2PositionSummary {
  poolId: string;
  poolIdBN: BN;
  asset0: {
    id: string;
    symbol: string;
    price: number;
  };
  asset1: {
    id: string;
    symbol: string;
    price: number;
  };
  binStep: number;
  activeBinId: number;
  totalLiquidityX: BN;
  totalLiquidityY: BN;
  totalFeesX: BN;
  totalFeesY: BN;
  binPositions: V2BinPosition[];
  numberOfBins: number;
}

interface V2PoolFromIndexer {
  id: string;
  asset0: {
    id: string;
    symbol: string;
    price: string;
  };
  asset1: {
    id: string;
    symbol: string;
    price: string;
  };
  binStepBps: number;
  activeBinId: number;
}

export function useV2Positions(): {
  data: V2PositionSummary[] | undefined;
  isLoading: boolean;
  error: Error | null;
} {
  const readonlyMiraV2 = useReadonlyMiraV2();
  const {wallet} = useWallet();
  const userAddress = wallet?.address;
  const {balances} = useBalances();

  const {data, isLoading, error} = useQuery({
    queryKey: ["v2Positions", userAddress?.toString(), balances],
    queryFn: async (): Promise<V2PositionSummary[]> => {
      if (!readonlyMiraV2 || !userAddress || !balances) {
        return [];
      }

      try {
        console.log(
          "🔍 Fetching V2 positions for user:",
          userAddress.toString()
        );
        console.log("📊 User balances:", balances.length);

        // Query the indexer for positions owned by this user
        const assetIds = balances.map((balance) => balance.assetId);

        console.log("🎫 Checking NFT asset IDs:", assetIds);

        if (assetIds.length === 0) {
          console.log("⚠️ No assets in wallet");
          return [];
        }

        const query = gql`
          query UserV2Positions($assetIds: [String!]!) {
            positions(where: {id_in: $assetIds}) {
              id
              pool {
                id
                asset0 {
                  id
                  symbol
                  price
                }
                asset1 {
                  id
                  symbol
                  price
                }
                binStepBps
                activeBinId
                feesUSD
              }
              binPositions {
                bin {
                  binId
                  price
                  priceDecimalFormat
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
        `;

        const result = await request<{positions: any[]}>({
          url: SQDIndexerUrl,
          document: query,
          variables: {
            assetIds,
          },
        });

        console.log(
          "📍 Positions from indexer:",
          result.positions?.length || 0
        );

        if (!result.positions || result.positions.length === 0) {
          console.log("⚠️ No positions found in indexer");
          return [];
        }

        // Step 2: Group positions by pool and aggregate data
        const positionsByPool = new Map<string, any>();

        for (const position of result.positions) {
          const poolId = position.pool.id;

          if (!positionsByPool.has(poolId)) {
            positionsByPool.set(poolId, {
              pool: position.pool,
              binPositions: [],
            });
          }

          // Add bin positions from this position
          positionsByPool
            .get(poolId)!
            .binPositions.push(...position.binPositions);
        }

        console.log("🏊 Pools with positions:", positionsByPool.size);

        // Step 3: Transform to V2PositionSummary format
        const positionPromises = Array.from(positionsByPool.entries()).map(
          async ([poolIdStr, poolData]) => {
            try {
              const poolBN = new BN(poolIdStr);
              const pool = poolData.pool;
              const indexerBinPositions = poolData.binPositions;

              console.log(`🏊 Processing pool ${poolIdStr}:`, {
                binPositions: indexerBinPositions.length,
              });

              // Get the active bin
              const activeBinIdUint = await readonlyMiraV2.getActiveBin(poolBN);

              // Transform bin positions from indexer data
              const binPositions: V2BinPosition[] = indexerBinPositions.map(
                (binPos: any) => {
                  const binId = binPos.bin.binId;
                  const price = parseFloat(binPos.bin.priceDecimalFormat || '0');

                  // Calculate fees as difference between redeemable and initial reserves
                  const redeemableX = new BN(binPos.redeemableReserveX);
                  const redeemableY = new BN(binPos.redeemableReserveY);
                  const initialX = new BN(binPos.initialReserveX);
                  const initialY = new BN(binPos.initialReserveY);

                  const feesX = redeemableX.gt(initialX)
                    ? redeemableX.sub(initialX)
                    : new BN(0);
                  const feesY = redeemableY.gt(initialY)
                    ? redeemableY.sub(initialY)
                    : new BN(0);

                  return {
                    binId: new BN(binId),
                    lpToken: `${poolIdStr}-bin-${binId}`,
                    lpTokenAmount: new BN(binPos.liquidityShares),
                    underlyingAmounts: {
                      x: redeemableX,
                      y: redeemableY,
                    },
                    underlyingAmountsDecimals: {
                      x: binPos.redeemableReservesXDecimals,
                      y: binPos.redeemableReservesYDecimals,
                    },
                    initialAmounts: {
                      x: initialX,
                      y: initialY,
                    },
                    initialAmountsDecimals: {
                      x: binPos.initialReservesXDecimals,
                      y: binPos.initialReservesYDecimals,
                    },
                    price,
                    feesEarned: {
                      x: feesX,
                      y: feesY,
                    },
                    isActive:
                      activeBinIdUint !== null && binId === activeBinIdUint,
                  };
                }
              );

              // Calculate totals
              let totalLiquidityX = new BN(0);
              let totalLiquidityY = new BN(0);
              let totalFeesX = new BN(0);
              let totalFeesY = new BN(0);

              for (const pos of binPositions) {
                totalLiquidityX = totalLiquidityX.add(pos.underlyingAmounts.x);
                totalLiquidityY = totalLiquidityY.add(pos.underlyingAmounts.y);
                totalFeesX = totalFeesX.add(pos.feesEarned.x);
                totalFeesY = totalFeesY.add(pos.feesEarned.y);
              }

              const summary: V2PositionSummary = {
                poolId: poolIdStr,
                poolIdBN: poolBN,
                asset0: {
                  id: pool.asset0.id,
                  symbol: pool.asset0.symbol,
                  price: parseFloat(pool.asset0.price),
                },
                asset1: {
                  id: pool.asset1.id,
                  symbol: pool.asset1.symbol,
                  price: parseFloat(pool.asset1.price),
                },
                binStep: pool.binStepBps,
                activeBinId: pool.activeBinId,
                totalLiquidityX,
                totalLiquidityY,
                totalFeesX,
                totalFeesY,
                binPositions,
                numberOfBins: binPositions.length,
              };

              console.log(`✅ Position summary for pool ${poolIdStr}:`, {
                numberOfBins: summary.numberOfBins,
                totalX: totalLiquidityX.toString(),
                totalY: totalLiquidityY.toString(),
              });

              return summary;
            } catch (error) {
              console.error(
                `❌ Failed to fetch positions for pool ${poolIdStr}:`,
                error
              );
              return null;
            }
          }
        );

        const positionResults = await Promise.all(positionPromises);

        // Filter out null results
        const validPositions = positionResults.filter(
          (result): result is V2PositionSummary => result !== null
        );

        console.log(
          `✨ Successfully loaded ${validPositions.length} v2 position(s)`
        );

        return validPositions;
      } catch (error) {
        console.error("❌ Error fetching V2 positions:", error);
        throw error;
      }
    },
    enabled: Boolean(readonlyMiraV2 && userAddress && balances),
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // Refetch every minute
    retry: 1,
  });

  return {
    data,
    isLoading,
    error: error as Error | null,
  };
}
