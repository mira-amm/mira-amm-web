"use client";

import Link from "next/link";
import {ChevronLeft} from "lucide-react";
import {useState, useMemo} from "react";
import {BN} from "fuels";
import PriceRange from "./components/price-range";
import {Button} from "@/meshwave-ui/Button";
import {cn} from "@/src/utils/cn";
import PriceSummary from "./components/price-summary";
import {
  PoolTypeToggle,
  type PoolTypeOption,
} from "../../common/PoolTypeToggle/PoolTypeToggle";
import {useUserBinPositionsV2, useRemoveAllBinsV2} from "@/src/hooks";
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

const RemoveBinLiquidity = ({
  onClose,
  assetA,
  assetB,
  poolType = "v1",
  v2PoolId,
}: {
  onClose?: () => void;
  assetA: AssetData;
  assetB: AssetData;
  poolType?: PoolTypeOption;
  v2PoolId?: BN;
}) => {
  const {isConnected} = useIsConnected();
  const {connect} = useConnectUI();
  const [selectedPoolType, setSelectedPoolType] =
    useState<PoolTypeOption>(poolType);

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

  // V2 position management
  const {data: v2Positions, isLoading: v2Loading} = useUserBinPositionsV2(
    selectedPoolType === "v2" ? v2PoolId : undefined
  );

  const {mutateAsync: removeAllBinsV2, isPending: v2RemovePending} =
    useRemoveAllBinsV2({
      poolId: v2PoolId || new BN(0),
      userPositions: v2Positions || [],
      slippage: 50, // 0.5% slippage
    });

  // Get asset symbol for RemoveSingle component
  const getAssetSymbol = (id: string) => {
    const symbolA = assetA?.metadata?.symbol || "Asset A";
    const symbolB = assetB?.metadata?.symbol || "Asset B";

    if (id === symbolA.toLowerCase()) return symbolA;
    if (id === symbolB.toLowerCase()) return symbolB;
    return id.toUpperCase();
  };

  // Handle v2 removal
  const handleV2Remove = async () => {
    if (!isConnected) {
      connect();
      return;
    }

    try {
      await removeAllBinsV2();
      onClose?.();
    } catch (error) {
      console.error("Failed to remove v2 liquidity:", error);
    }
  };

  const hasV2Positions = (v2Positions?.length || 0) > 0;

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
            Remove Liquidity
          </p>

          <div>
            <div className="text-content-primary mb-2 text-base">Pool Type</div>
            <PoolTypeToggle
              selectedType={selectedPoolType}
              onTypeChange={setSelectedPoolType}
              className="mb-4"
            />
          </div>

          {selectedPoolType === "v2" ? (
            <div className="space-y-4">
              {v2Loading ? (
                <div className="text-center py-4">
                  <p className="text-content-dimmed-dark">
                    Loading positions...
                  </p>
                </div>
              ) : !hasV2Positions ? (
                <div className="text-center py-8">
                  <p className="text-content-dimmed-dark">
                    No v2 liquidity positions found in this pool.
                  </p>
                </div>
              ) : (
                <>
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-md">
                    <p className="text-sm text-blue-700 dark:text-blue-300 mb-2">
                      <strong>Your V2 Positions:</strong>
                    </p>
                    <div className="space-y-1 text-xs">
                      {v2Positions?.map((position, index) => (
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

                  <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-md">
                    <p className="text-sm text-yellow-700 dark:text-yellow-300">
                      <strong>Simple Mode:</strong> This will remove liquidity
                      from all your bins in this pool. For advanced bin-specific
                      removal, use the position management dashboard.
                    </p>
                  </div>
                </>
              )}
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <div className="border border-content-tertiary rounded-md flex w-full">
                  {timeData.map((period, index, array) => (
                    <button
                      key={period.id}
                      className={cn(
                        "px-3.5 py-2.5 text-sm  transition-all w-1/2",
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
            </>
          )}

          {!isConnected ? (
            <Button onClick={connect} size="2xl">
              Connect Wallet
            </Button>
          ) : selectedPoolType === "v2" ? (
            <Button
              size="2xl"
              onClick={handleV2Remove}
              disabled={!hasV2Positions || v2RemovePending}
            >
              {v2RemovePending ? "Removing..." : "Confirm V2 Removal"}
            </Button>
          ) : (
            <Button size="2xl">Confirm</Button>
          )}
        </div>
      </section>
    </div>
  );
};

export default RemoveBinLiquidity;
