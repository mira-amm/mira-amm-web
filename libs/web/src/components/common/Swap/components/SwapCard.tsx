import {PoolId} from "mira-dex-ts";
import {BN} from "fuels";
import {
  CurrencyBox,
  Logo,
  IconButton,
  SlippageSetting,
  FeatureGuard,
} from "@/src/components/common";
import {ArrowUpDown} from "lucide-react";
import {cn} from "@/src/utils/cn";
import {createPoolKey} from "@/src/utils/common";
import {PreviewSummary, Rate, SwapActionButton} from ".";
import type {CurrencyBoxMode, TradeState, SwapState} from "@/src/hooks";
const lineSplitterClasses = "relative w-full h-px bg-background-grey-dark my-4";
const currencyBoxWidgetBg = "bg-background-grey-dark";

export function SwapCard({
  isWidget,
  swapPending,
  slippage,
  openSettingsModal,
  formState,
  swapDataLayer,
  inputPreviewLoading,
  outputPreviewLoading,
  handleCoinSelectorClick,
  transaction,
  previewLoading,
  txCostPending,
  feeValue,
  isConnected,
  isConnecting,
  connect,
  isActionDisabled,
  isActionLoading,
  validation,
  isRebrandingEnabled,
}: {
  isWidget?: boolean;
  swapPending: boolean;
  slippage: number;
  openSettingsModal: () => void;
  formState: {
    sellValue: string;
    buyValue: string;
    swapState: SwapState;
    setAmount: (mode: "sell" | "buy") => (amount: string) => void;
    swapAssets: () => void;
  };
  swapDataLayer: {
    sellBalance: BN;
    buyBalance: BN;
    sellAssetPrice: {price: number | null};
    buyAssetPrice: {price: number | null};
    tradeState: TradeState;
    exchangeRate: string | null;
    pools: PoolId[];
    sellMetadata: {symbol?: string};
    reservesPrice: number | undefined;
    previewPrice: number | undefined;
  };
  inputPreviewLoading: boolean;
  outputPreviewLoading: boolean;
  handleCoinSelectorClick: (mode: CurrencyBoxMode) => void;
  transaction: {
    review: boolean;
    txCost: number | null;
    handleSwapClick: () => void;
  };
  previewLoading: boolean;
  txCostPending: boolean;
  feeValue: string;
  isConnected: boolean;
  isConnecting: boolean;
  connect: () => void;
  isActionDisabled: boolean;
  isActionLoading: boolean;
  validation: {
    swapButtonTitle: string;
  };
  isRebrandingEnabled: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 p-5 pb-[18px] rounded-ten bg-background-grey-dark border-border-secondary border-[12px] dark:border-0 dark:bg-background-grey-dark",
        swapPending && "z-[5]"
      )}
    >
      <div className="flex items-center gap-[10px]  text-base leading-[19px] text-content-grey lg:text-xl lg:leading-[24px]">
        <div className="flex-1 text-black dark:text-content-primary">
          {isWidget ? <Logo /> : <p>Swap</p>}
        </div>
        <SlippageSetting
          slippage={slippage}
          openSettingsModal={openSettingsModal}
        />
      </div>

      <CurrencyBox
        value={formState.sellValue}
        assetId={formState.swapState.sell.assetId}
        mode="sell"
        balance={swapDataLayer.sellBalance}
        setAmount={formState.setAmount("sell")}
        loading={inputPreviewLoading || swapPending}
        onCoinSelectorClick={handleCoinSelectorClick}
        usdRate={swapDataLayer.sellAssetPrice.price}
        className={isWidget ? currencyBoxWidgetBg : undefined}
      />

      <div className={lineSplitterClasses}>
        <IconButton
          className="group absolute top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 flex justify-center items-center rounded-full dark:bg-background-primary dark:text-content-grey hover:text-content-primary bg-background-primary p-2"
          type="button"
          aria-label="Switch tokens"
          isDisabled={swapPending || inputPreviewLoading || outputPreviewLoading || txCostPending}
          onClick={formState.swapAssets}
        >
          <ArrowUpDown className="transition-transform duration-300 group-hover:rotate-180 text-white dark:text-content-dimmed-dark" />
        </IconButton>
      </div>

      <CurrencyBox
        value={formState.buyValue}
        assetId={formState.swapState.buy.assetId}
        mode="buy"
        balance={swapDataLayer.buyBalance}
        setAmount={formState.setAmount("buy")}
        loading={outputPreviewLoading || swapPending}
        onCoinSelectorClick={handleCoinSelectorClick}
        usdRate={swapDataLayer.buyAssetPrice.price}
        className={isWidget ? currencyBoxWidgetBg : undefined}
      />

      {transaction.review && (
        <PreviewSummary
          previewLoading={previewLoading}
          tradeState={swapDataLayer.tradeState}
          exchangeRate={swapDataLayer.exchangeRate}
          pools={swapDataLayer.pools}
          feeValue={feeValue}
          sellMetadataSymbol={swapDataLayer.sellMetadata.symbol ?? ""}
          txCost={transaction.txCost}
          txCostPending={txCostPending}
          createPoolKeyFn={createPoolKey}
          reservesPrice={swapDataLayer.reservesPrice}
          previewPrice={swapDataLayer.previewPrice}
        />
      )}

      <FeatureGuard>
        <Rate swapState={formState.swapState} />
      </FeatureGuard>

      <SwapActionButton
        isConnected={isConnected}
        isConnecting={isConnecting}
        connect={connect}
        isActionDisabled={isActionDisabled}
        isActionLoading={isActionLoading}
        handleSwapClick={transaction.handleSwapClick}
        swapButtonTitle={validation.swapButtonTitle}
        isRebrandingEnabled={isRebrandingEnabled}
      />
    </div>
  );
}
