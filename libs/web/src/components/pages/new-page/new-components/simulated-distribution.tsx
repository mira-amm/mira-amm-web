"use client";

import {Card, CardContent} from "@/meshwave-ui/card";

const liquidityData = [
  {price: "2,387.36", uniHeight: 8, ethHeight: 0, showPrice: true},
  {price: "", uniHeight: 12, ethHeight: 0, showPrice: false},
  {price: "", uniHeight: 18, ethHeight: 0, showPrice: false},
  {price: "", uniHeight: 24, ethHeight: 0, showPrice: false},
  {price: "", uniHeight: 32, ethHeight: 0, showPrice: false},
  {price: "", uniHeight: 38, ethHeight: 0, showPrice: false},
  {price: "", uniHeight: 44, ethHeight: 0, showPrice: false},
  {price: "2,399.32", uniHeight: 50, ethHeight: 0, showPrice: true},
  {price: "", uniHeight: 56, ethHeight: 0, showPrice: false},
  {price: "", uniHeight: 74, ethHeight: 0, showPrice: false},
  {price: "2,411.34", uniHeight: 80, ethHeight: 8, showPrice: true},
  {price: "", uniHeight: 74, ethHeight: 16, showPrice: false},
  {price: "", uniHeight: 68, ethHeight: 24, showPrice: false},
  {price: "", uniHeight: 62, ethHeight: 32, showPrice: false},
  {price: "", uniHeight: 90, ethHeight: 10, showPrice: false},
  {price: "2,423.42", uniHeight: 50, ethHeight: 88, showPrice: true},
  {price: "", uniHeight: 0, ethHeight: 82, showPrice: false},
  {price: "", uniHeight: 0, ethHeight: 90, showPrice: false},
  {price: "", uniHeight: 0, ethHeight: 70, showPrice: false},
  {price: "", uniHeight: 0, ethHeight: 64, showPrice: false},
  {price: "", uniHeight: 0, ethHeight: 58, showPrice: false},
  {price: "2,435.56", uniHeight: 0, ethHeight: 52, showPrice: true},
  {price: "", uniHeight: 0, ethHeight: 46, showPrice: false},
  {price: "", uniHeight: 0, ethHeight: 40, showPrice: false},
  {price: "", uniHeight: 0, ethHeight: 16, showPrice: false},
  {price: "2,447.77", uniHeight: 0, ethHeight: 10, showPrice: true},
  {price: "", uniHeight: 0, ethHeight: 6, showPrice: false},
  {price: "", uniHeight: 0, ethHeight: 4, showPrice: false},
];

export default function SimulatedDistribution({
  data = liquidityData,
}: {
  data?: typeof liquidityData;
}) {
  return (
    <Card className="border-0 p-0 shadow-none bg-transparent">
      <CardContent className="pt-0">
        {/* Dashed border lines */}
        <div className="relative">
          {/* Chart container */}
          <div className="">
            {/* Chart bars */}
            <div className="flex items-end justify-center gap-1 mb-6">
              {data.map((data, index) => (
                <div key={index} className="flex flex-col items-center">
                  <div
                    className="flex flex-col items-center justify-end"
                    style={{height: "103px"}}
                  >
                    {/* ETH bar (blue) - stacked on top */}
                    {data.ethHeight > 0 && (
                      <div
                        className="w-4 bg-[#72A2FF] rounded-t-md"
                        style={{height: `${data.ethHeight}px`}}
                      ></div>
                    )}
                    {/* UNI bar (red) - stacked on bottom */}
                    {data.uniHeight > 0 && (
                      <div
                        className={`w-4 bg-[#F95465] ${data.ethHeight === 0 ? "rounded-t-md" : ""} rounded-b-md`}
                        style={{height: `${data.uniHeight}px`}}
                      ></div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Price labels */}
            <div className="flex justify-between text-content-tertiary">
              {liquidityData
                .filter((data) => data.showPrice)
                .map((data, index) => (
                  <span key={index} className="text-center text-xs">
                    {data.price}
                  </span>
                ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
