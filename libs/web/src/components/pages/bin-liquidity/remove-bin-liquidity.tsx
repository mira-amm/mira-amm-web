"use client";

import Link from "next/link";
import {ChevronLeft} from "lucide-react";
import {useState, useMemo} from "react";
import PriceRange from "./components/price-range";
import {Button} from "@/meshwave-ui/Button";
import {cn} from "@/src/utils/cn";
import PriceSummary from "./components/price-summary";

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
}: {
  onClose?: () => void;
  assetA: AssetData;
  assetB: AssetData;
}) => {
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

  // Get asset symbol for RemoveSingle component
  const getAssetSymbol = (id: string) => {
    const symbolA = assetA?.metadata?.symbol || "Asset A";
    const symbolB = assetB?.metadata?.symbol || "Asset B";

    if (id === symbolA.toLowerCase()) return symbolA;
    if (id === symbolB.toLowerCase()) return symbolB;
    return id.toUpperCase();
  };

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

          <Button size="2xl">Confirm</Button>
        </div>
      </section>
    </div>
  );
};

export default RemoveBinLiquidity;
