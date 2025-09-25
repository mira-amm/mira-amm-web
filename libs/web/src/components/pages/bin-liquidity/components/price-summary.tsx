import {V2BinPosition} from "@/src/hooks";
import {bn, BN} from "fuels";
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
  userPositions,
  slippage = 50, // basis points, 50 = 0.5%
}: {
  assetA: AssetData;
  assetB: AssetData;
  userPositions?: V2BinPosition[];
  slippage?: number; // in bps
}) => {
  const symbolA = assetA?.metadata?.symbol || "Asset A";
  const symbolB = assetB?.metadata?.symbol || "Asset B";

  const decimalsA = assetA?.metadata?.decimals;
  const decimalsB = assetB?.metadata?.decimals;

  const totals = useMemo(() => {
    if (!userPositions?.length) {
      return {
        totalX: new BN(0),
        totalY: new BN(0),
      };
    }

    const totalX = userPositions.reduce(
      (acc, p) => acc.add(p.underlyingAmounts.x),
      new BN(0)
    );
    const totalY = userPositions.reduce(
      (acc, p) => acc.add(p.underlyingAmounts.y),
      new BN(0)
    );

    return {totalX, totalY};
  }, [userPositions]);

  const minimums = useMemo(() => {
    // Apply slippage bps to get minimum expected values
    const x = totals.totalX.mul(bn(10_000).sub(bn(slippage))).div(bn(10_000));
    const y = totals.totalY.mul(bn(10_000).sub(bn(slippage))).div(bn(10_000));
    return {x, y};
  }, [totals, slippage]);

  const formatAmount = (amount: BN, decimals: number) => {
    return amount.formatUnits(decimals);
  };

  return (
    <div className="">
      <div className="flex justify-between items-center mb-4">
        <div className="text-content-primary text-base ">You'll receive</div>
      </div>

      <div className="bg-background-primary p-5 rounded-lg flex flex-col gap-y-4 dark:border dark:border-border-secondary">
        <div className="flex flex-col gap-y-1">
          <div className="flex justify-between items-center">
            <div className="text-accent-primary text-sm">
              Minimum Expected {symbolA}:
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-accent-secondary rounded-full mr-2"></div>
              <span className="text-accent-primary text-sm">
                {formatAmount(minimums.x, decimalsA)}
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
                {formatAmount(minimums.y, decimalsB)}
              </span>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-y-1">
          <div className="flex justify-between items-center">
            <div className="text-accent-secondary text-sm">Price range:</div>
            <div className="flex items-center">
              <span className="text-accent-secondary text-sm">
                {/* Placeholder: replace with real range if available in parent */}
                —
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
