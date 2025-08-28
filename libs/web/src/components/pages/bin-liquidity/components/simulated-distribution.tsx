"use client";

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

// Generate bin data based on actual parameters
function generateBinData(
  minPrice: number,
  maxPrice: number,
  numBins: number,
  currentPrice: number,
  liquidityShape: LiquidityShape
): LiquidityData {
  const data: LiquidityData = [];
  const priceStep = (maxPrice - minPrice) / (numBins - 1);
  const centerPrice = (minPrice + maxPrice) / 2; // Center of the selected range

  for (let i = 0; i < numBins; i++) {
    const binPrice = minPrice + i * priceStep;
    const isCurrentPrice = Math.abs(binPrice - currentPrice) < priceStep / 2;

    // Calculate distribution height based on shape and distance from center
    let heightMultiplier = 1;
    const distanceFromCenter = Math.abs(binPrice - centerPrice);
    const maxDistance = Math.abs(maxPrice - centerPrice);

    switch (liquidityShape) {
      case "curve":
        // Bell curve - highest at center, decreasing towards edges
        // Use a gentler curve to ensure all bins are visible
        const normalizedDistance = distanceFromCenter / maxDistance;
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
        // Higher at edges, lower in middle
        heightMultiplier =
          1 - Math.exp(-Math.pow(distanceFromCenter / (maxDistance / 3), 2));
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
      binId: i,
      price: binPrice.toFixed(4),
      assetAHeight,
      assetBHeight,
      asset0Value: assetAHeight,
      asset1Value: assetBHeight,
      showPrice: i === 0 || i === numBins - 1, // Only show first and last prices
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
  numBins,
  currentPrice = 1.0,
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
  numBins?: number;
  currentPrice?: number;
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
      numBins !== undefined &&
      currentPrice !== undefined
    ) {
      // Generate data based on actual parameters
      const generatedData = generateBinData(
        minPrice,
        maxPrice,
        numBins,
        currentPrice,
        liquidityShape
      );

      // Limit display to maximum 50 bins to prevent overflow
      const maxDisplayBins = 50;
      const finalData = combineBins(generatedData, maxDisplayBins);
      setSimulationData(finalData);
    } else {
      // No data to render when props are not provided
      setSimulationData(null);
    }
  }, [liquidityShape, minPrice, maxPrice, numBins, currentPrice]);

  // Don't render anything if we don't have data yet
  if (!simulationData) {
    return null;
  }

  return (
    <div className="h-56">
      {/* Chart container */}
      <div className="relative h-40">
        {/* Chart bars */}
        <div className="flex items-end h-full gap-0.5">
          {simulationData.map((dataPoint, index) => {
            // Ensure minimum visible height
            const assetAHeight = Math.max(dataPoint.assetAHeight, 0);
            const assetBHeight = Math.max(dataPoint.assetBHeight, 0);
            const hasAnyBar = assetAHeight > 0 || assetBHeight > 0;

            // Calculate consistent width based on available space and number of bins
            // Account for gaps: total gaps = (numBars - 1) * 2px
            const gapWidth = (simulationData.length - 1) * 2; // 2px gap between bars
            const availableWidth = `calc((100% - ${gapWidth}px) / ${simulationData.length})`;
            const widthStyle = {
              width: availableWidth,
              minWidth: "1px",
              maxWidth: "20px", // Prevent bars from getting too wide with few bins
            };

            // Calculate actual deposited token amounts for this bin
            // Heights represent relative distribution, convert to actual deposit amounts
            const calculateDepositedAmount = (
              relativeHeight: number,
              totalAmount: number,
              totalHeight: number
            ) => {
              if (!totalAmount || !totalHeight || totalHeight === 0) return 0;
              return (relativeHeight / totalHeight) * totalAmount;
            };

            // Calculate total heights for normalization
            const totalAsset0Height = simulationData.reduce(
              (sum, d) => sum + d.assetAHeight,
              0
            );
            const totalAsset1Height = simulationData.reduce(
              (sum, d) => sum + d.assetBHeight,
              0
            );

            // Calculate actual deposited amounts for this specific bin
            const depositedAsset0 = totalAsset0Amount
              ? calculateDepositedAmount(
                  assetAHeight,
                  totalAsset0Amount,
                  totalAsset0Height
                )
              : 0;
            const depositedAsset1 = totalAsset1Amount
              ? calculateDepositedAmount(
                  assetBHeight,
                  totalAsset1Amount,
                  totalAsset1Height
                )
              : 0;

            // Calculate price range for this bar
            const binWidth = (maxPrice! - minPrice!) / (numBins || 1);
            const binStartPrice = minPrice! + index * binWidth;
            const binEndPrice = binStartPrice + binWidth;

            // Format price range for display
            const priceRangeInfo = `${binStartPrice.toFixed(4)} - ${binEndPrice.toFixed(4)}`;

            return (
              <div
                key={index}
                className="flex flex-col items-center h-full justify-end"
                style={widthStyle}
              >
                {/* Show a placeholder if no data */}
                {!hasAnyBar && <div className="h-1 bg-gray-200 w-full"></div>}

                {/* Asset B bar (blue) - stacked on top */}
                {assetBHeight > 0 && (
                  <div
                    className="bg-blue-500 rounded-t-md w-full"
                    style={{height: `${Math.min(assetBHeight, 140)}px`}}
                    title={`Price Range: ${priceRangeInfo}\n${asset1Symbol || "Asset B"}: ${depositedAsset1.toFixed(4)} tokens`}
                  ></div>
                )}

                {/* Asset A bar (red) - stacked on bottom */}
                {assetAHeight > 0 && (
                  <div
                    className={cn(
                      "bg-red-500 rounded-b-md w-full",
                      assetBHeight === 0 ? "rounded-t-md" : ""
                    )}
                    style={{height: `${Math.min(assetAHeight, 140)}px`}}
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
            <span className="text-center">{minPrice.toFixed(4)}</span>
            <span className="text-center">{maxPrice.toFixed(4)}</span>
          </>
        ) : (
          simulationData
            .filter((dataPoint) => dataPoint.showPrice)
            .map((dataPoint, index) => (
              <span key={index} className="text-center">
                {dataPoint.price}
              </span>
            ))
        )}
      </div>
    </div>
  );
}
