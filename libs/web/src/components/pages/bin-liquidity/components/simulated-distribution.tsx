"use client";

import {useEffect, useState} from "react";
import {graphVisualization} from "./mock-simulation-data";
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
        heightMultiplier = Math.exp(
          -Math.pow(distanceFromCenter / (maxDistance / 2), 2)
        );
        break;
      case "spot":
        // Concentrated around center
        heightMultiplier = distanceFromCenter < maxDistance * 0.1 ? 1 : 0.1;
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

    if (isCurrentPrice) {
      // At current price, show both assets (mixed bar)
      assetAHeight = baseHeight * 0.5;
      assetBHeight = baseHeight * 0.5;
    } else if (binPrice < currentPrice) {
      // Below current price, more of asset A (red)
      assetAHeight = baseHeight;
    } else {
      // Above current price, more of asset B (blue)
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

export default function SimulatedDistribution({
  data,
  liquidityShape = "spot",
  minPrice,
  maxPrice,
  numBins,
  currentPrice = 1.0,
}: {
  data?: LiquidityData;
  liquidityShape?: LiquidityShape;
  minPrice?: number;
  maxPrice?: number;
  numBins?: number;
  currentPrice?: number;
}) {
  const [simulationData, setSimulationData] = useState(
    data ?? graphVisualization[liquidityShape]
  );

  useEffect(() => {
    if (
      minPrice !== undefined &&
      maxPrice !== undefined &&
      numBins !== undefined
    ) {
      // Generate data based on actual parameters
      const generatedData = generateBinData(
        minPrice,
        maxPrice,
        numBins,
        currentPrice,
        liquidityShape
      );
      setSimulationData(generatedData);
    } else {
      const data = graphVisualization[liquidityShape];
      setSimulationData(data);
    }
  }, [liquidityShape, minPrice, maxPrice, numBins, currentPrice]);

  return (
    <div className="h-56">
      {/* Chart container */}
      <div className="relative h-40">
        {/* Chart bars */}
        <div className="flex items-end justify-between h-full">
          {simulationData.map((dataPoint, index) => {
            // Ensure minimum visible height
            // this will change and will be computed based on asset ratio
            const assetAHeight = Math.max(dataPoint.assetAHeight, 0);
            const assetBHeight = Math.max(dataPoint.assetBHeight, 0);
            const hasAnyBar = assetAHeight > 0 || assetBHeight > 0;

            return (
              <div
                key={index}
                className="flex flex-col items-center h-full justify-end"
              >
                {/* Show a placeholder if no data */}
                {!hasAnyBar && (
                  <div
                    className={cn(
                      "h-1 bg-gray-200",
                      simulationData.length >= 111 && "w-0.5",
                      simulationData.length <= 110 && "w-0.5",
                      simulationData.length <= 45 && "w-3"
                    )}
                  ></div>
                )}

                {/* ETH bar (blue) - stacked on top */}
                {assetBHeight > 0 && (
                  <div
                    className={cn(
                      "bg-blue-500 rounded-t-md",
                      simulationData.length >= 111 && "w-0.5",
                      simulationData.length <= 110 && "w-0.5",
                      simulationData.length <= 45 && "w-3"
                    )}
                    style={{height: `${Math.min(assetBHeight, 140)}px`}}
                    title={`ETH: ${assetBHeight}`}
                  ></div>
                )}

                {/* UNI bar (red) - stacked on bottom */}
                {assetAHeight > 0 && (
                  <div
                    className={cn(
                      "bg-red-500 rounded-b-md",
                      assetBHeight === 0 ? "rounded-t-md" : "",
                      simulationData.length >= 121 && "w-0.5",
                      simulationData.length <= 120 && "w-0.5",
                      simulationData.length <= 45 && "w-3"
                    )}
                    style={{height: `${Math.min(assetAHeight, 140)}px`}}
                    title={`UNI: ${assetAHeight}`}
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
