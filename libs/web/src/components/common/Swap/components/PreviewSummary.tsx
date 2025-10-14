import {memo} from "react";
import {TradeState} from "@/src/hooks";
import {PoolId} from "mira-dex-ts";
import {SwapRouteItem} from "@/src/components/common/Swap/components/SwapRouteItem";
import {FeatureGuard} from "@/src/components/common";
import {PriceImpactNew} from "@/src/components/common/Swap/components/PriceImpact";
import {cn} from "@/src/utils/cn";

export const PreviewSummary = memo(function PreviewSummary({
  previewLoading,
  tradeState,
  exchangeRate,
  pools,
  feeValue,
  sellMetadataSymbol,
  txCost,
  txCostPending,
  createPoolKeyFn,
  reservesPrice,
  previewPrice,
}: {
  previewLoading: boolean;
  tradeState: TradeState;
  exchangeRate: string | null;
  pools: PoolId[];
  feeValue: string;
  sellMetadataSymbol: string;
  txCost: number | null;
  txCostPending: boolean;
  createPoolKeyFn: (pool: PoolId) => string;
  reservesPrice: number | undefined;
  previewPrice: number | undefined;
}) {
  return (
    <div className="flex bg-background-primary dark:bg-background-secondary p-4 rounded-lg flex-col gap-2 text-accent-primary font-alt dark:text-content-tertiary leading-[16px]">
      <div className="flex justify-between">
        <p className="text-sm">Rate:</p>
        {previewLoading || tradeState === TradeState.REFETCHING ? (
          <PriceSummarySkeletonLoader className="w-[65%]" />
        ) : (
          <p className="text-sm">{exchangeRate}</p>
        )}
      </div>

      <div className="flex justify-between">
        <p className="text-sm">Routing:</p>
        {previewLoading || tradeState === TradeState.REFETCHING ? (
          <PriceSummarySkeletonLoader className="w-[35%]" />
        ) : (
          <div className="flex flex-wrap items-center gap-1">
            {pools.map((pool, i) => (
              <div
                className="flex items-center gap-1"
                key={createPoolKeyFn(pool)}
              >
                <SwapRouteItem pool={pool} />
                {i !== pools.length - 1 && <span>+</span>}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-between">
        <p className="text-sm">Estimated fees:</p>
        {previewLoading || tradeState === TradeState.REFETCHING ? (
          <PriceSummarySkeletonLoader className="w-[35%]" />
        ) : (
          <p className="text-sm">
            {feeValue} {sellMetadataSymbol}
          </p>
        )}
      </div>

      <div className="flex justify-between">
        <p className="text-sm">Gas cost:</p>
        {txCostPending ? (
          <PriceSummarySkeletonLoader className="w-[35%]" />
        ) : (
          <p className="text-sm">{txCost?.toFixed(9)} ETH</p>
        )}
      </div>

      <FeatureGuard>
        <PriceImpactNew
          reservesPrice={reservesPrice}
          previewPrice={previewPrice}
        />
      </FeatureGuard>
    </div>
  );
});

const PriceSummarySkeletonLoader = ({
  className = "w-[50%]",
}: {
  className?: string;
}) => {
  return (
    <div
      className={cn(
        "bg-accent-primary/30 animate-pulse h-3 rounded-md",
        className
      )}
    />
  );
};
