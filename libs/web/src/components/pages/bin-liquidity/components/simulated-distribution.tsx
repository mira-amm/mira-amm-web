"use client";
// NOTE: importing react is needed so that the test will run
import React from "react";
import {useEffect, useState} from "react";
import {cn} from "@/src/utils/cn";

export type LiquidityShape = "spot" | "curve" | "bidask";
export type SimulationDataPoint = {
  price: string;
  assetAHeight: number;
  assetBHeight: number;
  showPrice: boolean;
};

export type LiquidityData = {
  assetAHeight: number;
  assetBHeight: number;
  showPrice: boolean;

  binId: number;
  price: string;
  asset0Value: number;
  asset1Value: number;
}[];

// Generate bin data based on actual parameters with exponential price calculation
function generateBinData(
  minPrice: number,
  maxPrice: number,
  currentPrice: number,
  liquidityShape: LiquidityShape,
  binStepBasisPoints: number = 25 // Default 25 basis points (0.25%)
): LiquidityData {
  const data: LiquidityData = [];

  // Convert basis points to decimal: binStep = binStepBasisPoints / 10000
  const binStepDecimal = binStepBasisPoints / 10000;
  const logBase = Math.log(1 + binStepDecimal);

  // Calculate bin IDs for the price range
  const minBinId = Math.floor(Math.log(minPrice) / logBase);
  const maxBinId = Math.ceil(Math.log(maxPrice) / logBase);
  const currentBinId = Math.round(Math.log(currentPrice) / logBase);

  // Use all bins in the actual price range
  const startBinId = minBinId;
  const endBinId = maxBinId;

  // Use currentPrice as the reference point for shapes
  const referencePrice = currentPrice;

  for (let binId = startBinId; binId <= endBinId; binId++) {
    // Calculate price using exponential formula: price(n) = (1 + binStep)^n
    const binPrice = Math.pow(1 + binStepDecimal, binId);
    const i = binId - startBinId; // Index for array position
    const isCurrentPrice = binId === currentBinId;

    // Calculate distribution height based on shape and distance from current price
    let heightMultiplier = 1;
    const distanceFromCurrent = Math.abs(binPrice - referencePrice);
    const maxDistance = Math.max(
      Math.abs(referencePrice - minPrice),
      Math.abs(maxPrice - referencePrice)
    );

    switch (liquidityShape) {
      case "curve":
        // Bell curve - highest at current price, decreasing towards edges
        // Use a gentler curve to ensure all bins are visible
        const normalizedDistance =
          maxDistance > 0 ? distanceFromCurrent / maxDistance : 0;
        heightMultiplier = Math.max(
          0.2,
          Math.exp(-Math.pow(normalizedDistance * 1.5, 2))
        );
        break;
      case "spot":
        // Flat distribution - all bins have equal height
        heightMultiplier = 1;
        break;
      case "bidask":
        // Higher at edges, lower near current price
        const norm =
          maxDistance > 0 ? distanceFromCurrent / (maxDistance / 3) : 0;
        heightMultiplier = 1 - Math.exp(-Math.pow(norm, 2));
        break;
    }

    const maxHeight = 120;
    const baseHeight = heightMultiplier * maxHeight;

    // Determine asset distribution
    let assetAHeight = 0;
    let assetBHeight = 0;

    // Always show some liquidity, but adjust based on position relative to current price
    if (isCurrentPrice) {
      // At current price, show both assets (mixed bar)
      assetAHeight = baseHeight * 0.5;
      assetBHeight = baseHeight * 0.5;
    } else if (binPrice < currentPrice) {
      // Below current price, more of asset A (red)
      assetAHeight = baseHeight;
      assetBHeight = 0;
    } else {
      // Above current price, more of asset B (blue)
      assetAHeight = 0;
      assetBHeight = baseHeight;
    }

    data.push({
      binId: binId,
      price: binPrice.toFixed(4),
      assetAHeight,
      assetBHeight,
      asset0Value: assetAHeight,
      asset1Value: assetBHeight,
      showPrice: binId === startBinId || binId === endBinId, // Only show first and last prices
    });
  }

  return data;
}

// Combine bins when there are too many to display clearly
function combineBins(
  data: LiquidityData,
  maxDisplayBins: number
): LiquidityData {
  if (data.length <= maxDisplayBins) {
    return data;
  }

  const combinedData: LiquidityData = [];
  const groupSize = Math.ceil(data.length / maxDisplayBins);

  for (let i = 0; i < data.length; i += groupSize) {
    const group = data.slice(i, i + groupSize);
    const avgAssetAHeight =
      group.reduce((sum, bin) => sum + bin.assetAHeight, 0) / group.length;
    const avgAssetBHeight =
      group.reduce((sum, bin) => sum + bin.assetBHeight, 0) / group.length;
    const avgAsset0Value =
      group.reduce((sum, bin) => sum + bin.asset0Value, 0) / group.length;
    const avgAsset1Value =
      group.reduce((sum, bin) => sum + bin.asset1Value, 0) / group.length;

    // Use the middle bin's price as representative
    const middleIndex = Math.floor(group.length / 2);
    const representativeBin = group[middleIndex];

    combinedData.push({
      binId: combinedData.length,
      price: representativeBin.price,
      assetAHeight: avgAssetAHeight,
      assetBHeight: avgAssetBHeight,
      asset0Value: avgAsset0Value,
      asset1Value: avgAsset1Value,
      showPrice: representativeBin.showPrice,
    });
  }

  return combinedData;
}

export default function SimulatedDistribution({
  data,
  liquidityShape = "spot",
  minPrice,
  maxPrice,
  currentPrice = 1.0,
  binStepBasisPoints = 25, // Default 25 basis points (0.25%)
  asset0Symbol,
  asset1Symbol,
  asset0Price,
  asset1Price,
  totalAsset0Amount,
  totalAsset1Amount,
}: {
  data?: LiquidityData;
  liquidityShape?: LiquidityShape;
  minPrice?: number;
  maxPrice?: number;
  currentPrice?: number;
  binStepBasisPoints?: number; // In basis points (e.g., 25 for 0.25%)
  asset0Symbol?: string;
  asset1Symbol?: string;
  asset0Price?: number;
  asset1Price?: number;
  totalAsset0Amount?: number;
  totalAsset1Amount?: number;
}) {
  const [simulationData, setSimulationData] = useState<LiquidityData | null>(
    null
  );

  useEffect(() => {
    if (
      minPrice !== undefined &&
      maxPrice !== undefined &&
      currentPrice !== undefined
    ) {
      // Generate data based on actual parameters
      const generatedData = generateBinData(
        minPrice,
        maxPrice,
        currentPrice,
        liquidityShape,
        binStepBasisPoints
      );

      // Limit display to maximum 50 bins to prevent overflow
      const maxDisplayBins = 50;
      const finalData = combineBins(generatedData, maxDisplayBins);
      setSimulationData(finalData);
    } else {
      // No data to render when props are not provided
      setSimulationData(null);
    }
  }, [liquidityShape, minPrice, maxPrice, currentPrice, binStepBasisPoints]);

  // Don't render anything if we don't have data yet
  if (!simulationData) {
    return null;
  }

  // Precompute value-based heights using asset prices and totals
  const asset0P = asset0Price ?? 1;
  const asset1P = asset1Price ?? 1;

  // Treat generated assetAHeight/assetBHeight as distribution weights for token amounts
  const totalWeight0 = simulationData.reduce(
    (sum, d) => sum + Math.max(d.assetAHeight, 0),
    0
  );
  const totalWeight1 = simulationData.reduce(
    (sum, d) => sum + Math.max(d.assetBHeight, 0),
    0
  );

  // Compute per-bin deposited amounts based on provided totals (fallback to weights if totals are not provided)
  const hasTotal0 = totalAsset0Amount !== undefined;
  const hasTotal1 = totalAsset1Amount !== undefined;
  const perBinDeposits = simulationData.map((d) => {
    const weight0 = Math.max(d.assetAHeight, 0);
    const weight1 = Math.max(d.assetBHeight, 0);
    const amount0 = hasTotal0
      ? totalWeight0 > 0
        ? (weight0 / totalWeight0) * (totalAsset0Amount as number)
        : 0
      : weight0;
    const amount1 = hasTotal1
      ? totalWeight1 > 0
        ? (weight1 / totalWeight1) * (totalAsset1Amount as number)
        : 0
      : weight1;
    return {amount0, amount1};
  });

  // Compute per-bin total values and max for scaling
  const perBinValues = perBinDeposits.map(
    ({amount0, amount1}) => amount0 * asset0P + amount1 * asset1P
  );
  const maxBinValue = perBinValues.length > 0 ? Math.max(...perBinValues) : 0;

  return (
    <div className="h-56">
      {/* Chart container */}
      <div className="relative h-40">
        {/* Chart bars */}
        <div className="flex items-end h-full gap-0.5">
          {simulationData.map((dataPoint, index) => {
            // Value-based stacked heights
            const {amount0, amount1} = perBinDeposits[index];
            const binTotalValue = perBinValues[index];
            const maxPixelHeight = 140; // Keep visual cap consistent with previous styling
            const totalBarHeight =
              maxBinValue > 0
                ? (binTotalValue / maxBinValue) * maxPixelHeight
                : 0;
            const valueA = amount0 * asset0P;
            const valueB = amount1 * asset1P;
            const displayAssetAHeight =
              binTotalValue > 0 ? (valueA / binTotalValue) * totalBarHeight : 0;
            const displayAssetBHeight =
              binTotalValue > 0 ? (valueB / binTotalValue) * totalBarHeight : 0;

            const hasAnyBar =
              displayAssetAHeight > 0 || displayAssetBHeight > 0;

            // Calculate consistent width based on available space and number of bins
            // Account for gaps: total gaps = (numBars - 1) * 2px
            const gapWidth = (simulationData.length - 1) * 2; // 2px gap between bars
            const availableWidth = `calc((100% - ${gapWidth}px) / ${simulationData.length})`;
            const widthStyle = {
              width: availableWidth,
              minWidth: "1px",
              maxWidth: "20px", // Prevent bars from getting too wide with few bins
            };

            // Deposited amounts for tooltips
            const depositedAsset0 = amount0 || 0;
            const depositedAsset1 = amount1 || 0;

            // Use the actual bin price from the data for accurate display
            const currentBinPrice = parseFloat(dataPoint.price);
            const nextBinPrice =
              index < simulationData.length - 1
                ? parseFloat(simulationData[index + 1].price)
                : currentBinPrice * 1.01; // Small increment for last bin

            // Format price range for display - show the bin's price range
            const priceRangeInfo = `${currentBinPrice.toFixed(4)} - ${nextBinPrice.toFixed(4)}`;

            return (
              <div
                key={index}
                className="flex flex-col items-center h-full justify-end"
                style={widthStyle}
              >
                {/* Show a placeholder if no data */}
                {!hasAnyBar && <div className="h-1 bg-gray-200 w-full"></div>}

                {/* Asset B bar (blue) - stacked on top */}
                {displayAssetBHeight > 0 && (
                  <div
                    className={cn(
                      "bg-blue-500 rounded-t-md w-full",
                      displayAssetAHeight === 0 ? "rounded-b-md" : ""
                    )}
                    style={{height: `${Math.min(displayAssetBHeight, 140)}px`}}
                    title={`Price Range: ${priceRangeInfo}\n${asset1Symbol || "Asset B"}: ${depositedAsset1.toFixed(4)} tokens`}
                  ></div>
                )}

                {/* Asset A bar (red) - stacked on bottom */}
                {displayAssetAHeight > 0 && (
                  <div
                    className={cn(
                      "bg-red-500 rounded-b-md w-full",
                      displayAssetBHeight === 0 ? "rounded-t-md" : ""
                    )}
                    style={{height: `${Math.min(displayAssetAHeight, 140)}px`}}
                    title={`Price Range: ${priceRangeInfo}\n${asset0Symbol || "Asset A"}: ${depositedAsset0.toFixed(4)} tokens`}
                  ></div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Price labels */}
      <div className="flex justify-between text-gray-500 mt-4 text-xs">
        {minPrice !== undefined && maxPrice !== undefined ? (
          <>
            <span className="text-center font-alt">{minPrice.toFixed(4)}</span>
            <span className="text-center font-alt">{maxPrice.toFixed(4)}</span>
          </>
        ) : (
          simulationData
            .filter((dataPoint) => dataPoint.showPrice)
            .map((dataPoint, index) => (
              <span key={index} className="text-center font-alt">
                {dataPoint.price}
              </span>
            ))
        )}
      </div>
    </div>
  );
}
