"use client";

import {ChevronLeft} from "lucide-react";
import {useState, useMemo, useCallback} from "react";
import {BN} from "fuels";
import PriceRange from "./components/price-range";
import {Button} from "@/meshwave-ui/Button";
import {cn} from "@/src/utils/cn";
import PriceSummary from "./components/price-summary";
import {useRemoveAllBinsV2} from "@/src/hooks/useRemoveAllBinsV2";
import {useConnectUI, useIsConnected} from "@fuels/react";

type TimePeriod = {id: "both" | string; text: string};

const RemoveSingle = ({name}: {name: string}) => {
  return (
    <div className="bg-[#C5D8FE] rounded-md p-[15px]">
      <div className="text-[#2C3C62] text-xs">
        {`You will remove ${name} tokens from bins with prices higher than that of the active bin. ${name} tokens in the active bin will remain in the pool.`}
      </div>
    </div>
  );
};

interface AssetData {
  amount: string;
  metadata: {
    name?: string;
    symbol?: string;
    decimals?: number;
  } & {isLoading: boolean};
  reserve?: number;
}

interface V2BinPosition {
  binId: BN;
  lpTokenAmount: BN;
  underlyingAmounts: {x: BN; y: BN};
  price: number;
  isActive: boolean;
}

interface RemoveBinLiquidityV2Props {
  onClose?: () => void;
  assetA: AssetData;
  assetB: AssetData;
  poolId: BN;
  userPositions: V2BinPosition[];
  slippage?: number;
}

const RemoveBinLiquidityV2 = ({
  onClose,
  assetA,
  assetB,
  poolId,
  userPositions,
  slippage = 50, // 0.5% default slippage
}: RemoveBinLiquidityV2Props) => {
  const {isConnected} = useIsConnected();
  const {connect} = useConnectUI();

  const timeData: TimePeriod[] = useMemo(() => {
    const symbolA = assetA?.metadata?.symbol || "Asset A";
    const symbolB = assetB?.metadata?.symbol || "Asset B";

    return [
      {id: "both", text: "Remove both"},
      {id: symbolA.toLowerCase(), text: `Remove ${symbolA}`},
      {id: symbolB.toLowerCase(), text: `Remove ${symbolB}`},
    ];
  }, [assetA?.metadata?.symbol, assetB?.metadata?.symbol]);

  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>(timeData[0]);

  // Use the simple approach - remove from all user bins
  const {mutateAsync: removeLiquidity, isPending} = useRemoveAllBinsV2({
    poolId,
    userPositions,
    slippage,
  });

  const handleRemoveLiquidity = useCallback(async () => {
    if (!isConnected) {
      connect();
      return;
    }

    try {
      await removeLiquidity();
      onClose?.();
    } catch (error) {
      console.error("Failed to remove liquidity:", error);
    }
  }, [isConnected, connect, removeLiquidity, onClose]);

  // Get asset symbol for RemoveSingle component
  const getAssetSymbol = (id: string) => {
    const symbolA = assetA?.metadata?.symbol || "Asset A";
    const symbolB = assetB?.metadata?.symbol || "Asset B";

    if (id === symbolA.toLowerCase()) return symbolA;
    if (id === symbolB.toLowerCase()) return symbolB;
    return id.toUpperCase();
  };

  const hasPositions = userPositions.length > 0;

  return (
    <div className="flex flex-col gap-4 mx-auto max-w-[563px] w-full">
      <button
        className="flex items-center text-base leading-5 text-content-grey hover:text-content-primary cursor-pointer"
        onClick={onClose}
      >
        <ChevronLeft className="size-5" />
        Back to Pool
      </button>
      <section className="flex flex-col gap-3">
        <div className="w-full p-4 pb-10 rounded-[12px] flex flex-col gap-6 bg-background-grey-dark border-border-secondary border-[11px] dark:border-0 dark:bg-background-grey-dark">
          <p className="text-base text-content-primary leading-[19px] border-b border-content-grey-dark/40 pb-3">
            Remove Liquidity (v2)
          </p>

          {!hasPositions ? (
            <div className="text-center py-8">
              <p className="text-content-dimmed-dark">
                No liquidity positions found in this pool.
              </p>
            </div>
          ) : (
            <>
              {/* Position Summary */}
              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-md">
                <p className="text-sm text-blue-700 dark:text-blue-300 mb-2">
                  <strong>Your Positions:</strong>
                </p>
                <div className="space-y-1 text-xs">
                  {userPositions.map((position, index) => (
                    <div key={index} className="flex justify-between">
                      <span>
                        Bin {position.binId.toString()}{" "}
                        {position.isActive ? "(Active)" : ""}
                      </span>
                      <span>
                        {position.underlyingAmounts.x.toString()} /{" "}
                        {position.underlyingAmounts.y.toString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="border border-content-tertiary rounded-md flex w-full">
                  {timeData.map((period, index, array) => (
                    <button
                      key={period.id}
                      className={cn(
                        "px-3.5 py-2.5 text-sm font-medium transition-all w-1/2",
                        selectedPeriod.id === period.id
                          ? "bg-background-primary text-page-background"
                          : "text-background-primary",
                        index === 0
                          ? "rounded-l-md"
                          : index === array.length - 1
                            ? "rounded-r-md"
                            : "",
                        index === 1 && "border-x"
                      )}
                      onClick={() => setSelectedPeriod(period)}
                    >
                      {period.text}
                    </button>
                  ))}
                </div>
              </div>

              {selectedPeriod.id === "both" && <PriceRange />}
              {selectedPeriod.id !== "both" && (
                <RemoveSingle name={getAssetSymbol(selectedPeriod.id)} />
              )}

              <PriceSummary
                selectedPeriod={selectedPeriod.id}
                assetA={assetA}
                assetB={assetB}
              />

              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-md">
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  <strong>Simple Mode:</strong> This will remove liquidity from
                  all your bins in this pool. For advanced bin-specific removal,
                  use the position management dashboard.
                </p>
              </div>

              {!isConnected ? (
                <Button onClick={connect} size="2xl">
                  Connect Wallet
                </Button>
              ) : (
                <Button
                  size="2xl"
                  onClick={handleRemoveLiquidity}
                  disabled={!hasPositions || isPending}
                >
                  {isPending ? "Removing..." : "Confirm Removal"}
                </Button>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
};

export default RemoveBinLiquidityV2;
