"use client";

import {useMemo} from "react";
import {BN} from "fuels";
import {V2BinPosition} from "./useUserBinPositionsV2";

export interface PositionSummaryV2 {
  totalLiquidity: {x: BN; y: BN};
  totalFeesEarned: {x: BN; y: BN};
  totalBins: number;
  activeBins: number;
  inactiveBins: number;
  averagePrice: number;
  priceRange: {min: number; max: number};
}

export function usePositionSummaryV2(
  positions: V2BinPosition[]
): PositionSummaryV2 {
  return useMemo(() => {
    if (positions.length === 0) {
      return {
        totalLiquidity: {x: new BN(0), y: new BN(0)},
        totalFeesEarned: {x: new BN(0), y: new BN(0)},
        totalBins: 0,
        activeBins: 0,
        inactiveBins: 0,
        averagePrice: 0,
        priceRange: {min: 0, max: 0},
      };
    }

    // Calculate totals
    const totalLiquidity = positions.reduce(
      (total, position) => ({
        x: total.x.add(position.underlyingAmounts.x),
        y: total.y.add(position.underlyingAmounts.y),
      }),
      {x: new BN(0), y: new BN(0)}
    );

    const totalFeesEarned = positions.reduce(
      (total, position) => ({
        x: total.x.add(position.feesEarned.x),
        y: total.y.add(position.feesEarned.y),
      }),
      {x: new BN(0), y: new BN(0)}
    );

    // Count bin types
    const activeBins = positions.filter((p) => p.isActive).length;
    const inactiveBins = positions.length - activeBins;

    // Calculate price statistics
    const prices = positions.map((p) => p.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);

    // Calculate weighted average price based on liquidity
    const totalValue = positions.reduce((sum, position) => {
      const positionValue = position.underlyingAmounts.x.add(
        position.underlyingAmounts.y
      );
      return sum + positionValue.toNumber() * position.price;
    }, 0);

    const totalLiquidityValue = positions.reduce((sum, position) => {
      return (
        sum +
        position.underlyingAmounts.x
          .add(position.underlyingAmounts.y)
          .toNumber()
      );
    }, 0);

    const averagePrice =
      totalLiquidityValue > 0 ? totalValue / totalLiquidityValue : 0;

    return {
      totalLiquidity,
      totalFeesEarned,
      totalBins: positions.length,
      activeBins,
      inactiveBins,
      averagePrice,
      priceRange: {min: minPrice, max: maxPrice},
    };
  }, [positions]);
}
