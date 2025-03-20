import {FC, memo} from "react";
import styles from "./ReviewSwap.module.css";
import {TradeState} from "@/src/hooks/useSwapRouter";
import {PoolId} from "mira-dex-ts";
import {createPoolKey} from "@/src/utils/common";
import {useAssetImage} from "@/src/hooks/useAssetImage";
import useAssetMetadata from "@/src/hooks/useAssetMetadata";
import PriceImpact from "../PriceImpact/PriceImpact";
import Loader from "../../../Loader/Loader";

interface ReviewSwapProps {
  tradeState: TradeState;
  exchangeRate: string | null;
  pools: PoolId[] | undefined;
  feeValue: string | 0;
  sellMetadataSymbol: string | undefined;
  txCostPending: boolean;
  txCost: number | null;
  reservesPrice: number | undefined;
  previewPrice: number | undefined;
}

interface SwapRouteItemProps {
  pool: PoolId;
}

interface SummaryEntryProps {
  label: string;
  isLoading: boolean;
  value: React.ReactNode;
}

const SwapRouteItem: FC<SwapRouteItemProps> = ({pool}) => {
  const firstAssetIcon = useAssetImage(pool[0].bits);
  const secondAssetIcon = useAssetImage(pool[1].bits);

  const firstAssetMetadata = useAssetMetadata(pool[0].bits);
  const secondAssetMetadata = useAssetMetadata(pool[1].bits);

  const isStablePool = pool[2];
  const poolFeePercent = isStablePool ? 0.05 : 0.3;

  return (
    <>
      <img src={firstAssetIcon || ""} alt={firstAssetMetadata.symbol} />
      <img src={secondAssetIcon || ""} alt={secondAssetMetadata.symbol} />
      <p>({poolFeePercent}%)</p>
    </>
  );
};

const SummaryEntry: FC<SummaryEntryProps> = ({label, isLoading, value}) => {
  return (
    <div className={styles.summaryEntry}>
      <p>{label}</p>
      {isLoading ? <Loader color="gray" /> : <p>{value}</p>}
    </div>
  );
};

const ReviewSwap: FC<ReviewSwapProps> = ({
  tradeState,
  exchangeRate,
  pools,
  feeValue,
  sellMetadataSymbol,
  txCostPending,
  txCost,
  reservesPrice,
  previewPrice,
}) => {
  const isPreviewLoading =
    tradeState === TradeState.LOADING || tradeState === TradeState.REEFETCHING;

  return (
    <div className={styles.review}>
      <div className={styles.summary}>
        {/* Rate */}
        <SummaryEntry
          label="Rate:"
          isLoading={isPreviewLoading}
          value={exchangeRate}
        />

        {/* Routing */}
        <SummaryEntry
          label="Routing:"
          isLoading={isPreviewLoading}
          value={
            <div className={styles.feeLine}>
              {pools?.map((pool, index) => {
                const poolKey = createPoolKey(pool);
                return (
                  <div className={styles.poolsFee} key={poolKey}>
                    <SwapRouteItem pool={pool} />
                    {index !== pools.length - 1 && "+"}
                  </div>
                );
              })}
            </div>
          }
        />

        {/* Estimated Fees */}
        <SummaryEntry
          label="Estimated fees:"
          isLoading={isPreviewLoading}
          value={
            <>
              {feeValue} {sellMetadataSymbol}
            </>
          }
        />

        {/* Gas Cost */}
        <SummaryEntry
          label="Gas cost:"
          isLoading={txCostPending}
          value={<>{txCost?.toFixed(9)} ETH</>}
        />
      </div>
      <PriceImpact reservesPrice={reservesPrice} previewPrice={previewPrice} />
    </div>
  );
};

export default memo(ReviewSwap);
