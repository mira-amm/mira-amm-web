"use client";

import Link from "next/link";
import {ChevronLeft} from "lucide-react";
import {useState} from "react";
import PriceRange from "./new-components/price-range";
import {Button} from "@/meshwave-ui/Button";
import {cn} from "@/src/utils/cn";
import PriceSummary from "./new-components/price-summary";

type TimePeriod = {id: "both" | "uni" | "eth"; text: string};

const timeData: TimePeriod[] = [
  {id: "both", text: "Remove both"},
  {id: "uni", text: "Remove UNI"},
  {id: "eth", text: "Remove ETH"},
];

const RemoveSingle = ({name}: {name: string}) => {
  return (
    <div className="bg-[#C5D8FE] rounded-md p-[15px]">
      <div className="text-[#2C3C62] text-xs">
        {`You will remove ${name} tokens from bins with prices higher than that of the active bin. ${name} tokens in the active bin will remain in the pool.`}
      </div>
    </div>
  );
};

const RemoveLiquidityPage = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>({
    id: "both",
    text: "Remove both",
  });

  return (
    <main className="flex flex-col gap-4 mx-auto lg:w-[563px] w-full lg:px-4 lg:py-8">
      <Link
        href="/liquidity"
        className="flex items-center text-base leading-5 text-content-grey hover:text-content-primary cursor-pointer"
      >
        <ChevronLeft className="size-5" />
        Back to Pool
      </Link>
      <section className="flex flex-col gap-3 desktopOnly">
        <div className="w-full p-4 pb-10 rounded-[12px] flex flex-col gap-6 bg-background-grey-dark border-border-secondary border-[11px] dark:border-0 dark:bg-background-grey-dark">
          <p className="text-base text-content-primary font-semibold leading-[19px] border-b border-content-grey-dark/40 pb-3">
            Remove Liqudity
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
                    index === 1 && "border-x",
                  )}
                  onClick={() => setSelectedPeriod(period)}
                >
                  {period.text}
                </button>
              ))}
            </div>
          </div>

          {selectedPeriod.id === "both" && <PriceRange />}
          {selectedPeriod.id === "uni" && <RemoveSingle name="UNI" />}
          {selectedPeriod.id === "eth" && <RemoveSingle name="ETH" />}

          <PriceSummary selectedPeriod={selectedPeriod.id} />

          <Button size="2xl">Confirm</Button>
        </div>
      </section>
    </main>
  );
};

export default RemoveLiquidityPage;
