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

export default function SimulatedDistribution({
  data,
  liquidityShape = "spot",
}: {
  data?: LiquidityData;
  liquidityShape?: LiquidityShape;
}) {
  const [simulationData, setSimulationData] = useState(
    data ?? graphVisualization[liquidityShape]
  );

  useEffect(() => {
    const data = graphVisualization[liquidityShape];
    setSimulationData(data);
  }, [liquidityShape]);

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
        {simulationData
          .filter((dataPoint) => dataPoint.showPrice)
          .map((dataPoint, index) => (
            <span key={index} className="text-center">
              {dataPoint.price}
            </span>
          ))}
      </div>
    </div>
  );
}
