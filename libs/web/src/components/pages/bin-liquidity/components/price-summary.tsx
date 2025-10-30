import {V2PositionTotals} from "@/src/hooks/useUserBinPositionsV2";
import {bn, formatUnits} from "fuels";
import {useMemo} from "react";

interface AssetData {
  amount: string;
  metadata: {
    name?: string;
    symbol?: string;
    decimals?: number;
  } & {isLoading: boolean};
  reserve?: number;
}

const PriceSummary = ({
  assetA,
  assetB,
  slippage = 50, // basis points, 50 = 0.5%
  totals,
}: {
  assetA: AssetData;
  assetB: AssetData;
  slippage?: number; // in bps
  totals: V2PositionTotals;
}) => {
  const symbolA = assetA?.metadata?.symbol || "Asset A";
  const symbolB = assetB?.metadata?.symbol || "Asset B";

  const decimalsA = assetA?.metadata?.decimals;
  const decimalsB = assetB?.metadata?.decimals;

  // Calculate minimum amounts after slippage
  const {minX, minY} = useMemo(() => {
    // Apply slippage bps to get minimum expected values
    const minX = totals.totalX
      .mul(bn(10_000).sub(bn(slippage)))
      .div(bn(10_000));
    const minY = totals.totalY
      .mul(bn(10_000).sub(bn(slippage)))
      .div(bn(10_000));
    return {minX, minY};
  }, [totals.totalX, totals.totalY, slippage]);

  return (
    <div className="">
      <div className="flex justify-between items-center mb-4">
        <div className="text-content-primary text-base ">You'll receive</div>
      </div>

      <div className="bg-background-primary p-5 rounded-lg flex flex-col gap-y-4">
        <div className="flex flex-col gap-y-1">
          <div className="flex justify-between items-center">
            <div className="text-accent-primary text-sm">
              Minimum Expected {symbolA}:
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-accent-secondary rounded-full mr-2"></div>
              <span className="text-accent-primary text-sm">
                {formatUnits(minX, decimalsA)}
              </span>
            </div>
          </div>
          <div className="flex justify-between items-center">
            <div className="text-accent-primary text-sm">
              Minimum Expected {symbolB}:
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-[#72A2FF] rounded-full mr-2"></div>
              <span className="text-accent-primary text-sm">
                {formatUnits(minY, decimalsB)}
              </span>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-y-1">
          <div className="flex justify-between items-center">
            <div className="text-accent-secondary text-sm">Price range:</div>
            <div className="flex items-center">
              <span className="text-accent-secondary text-sm">
                {totals &&
                totals.minPrice !== Infinity &&
                totals.maxPrice !== -Infinity
                  ? `${totals.minPrice.toFixed(6)} - ${totals.maxPrice.toFixed(6)}`
                  : "—"}
              </span>
            </div>
          </div>
          <div className="flex justify-between items-center">
            <div className="text-accent-secondary text-sm">
              Amount Slippage Tolerance
            </div>
            <div className="flex items-center">
              <span className="text-accent-secondary text-sm">
                {(slippage / 100).toFixed(2)}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PriceSummary;
