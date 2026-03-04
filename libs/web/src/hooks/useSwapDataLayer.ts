import {useMemo, useEffect} from "react";
import {bn} from "fuels";
import {
  useBalances,
  useAssetMetadata,
  useDocumentTitle,
  useCheckActiveNetwork,
  useSwapPreview,
  useCheckEthBalance,
  useExchangeRate,
  useReservesPrice,
  useAssetPrice,
  TradeState,
  SwapState,
} from "@/src/hooks";
import {
  calculatePreviewPrice,
  calculateFeePercent,
  calculateFeeValue,
} from "@/src/utils/swapCalculations";

export function useSwapDataLayer({
  swapState,
  activeMode,
  sellValue,
  updateSwapStateAmount,
}: {
  swapState: SwapState;
  activeMode: "buy" | "sell";
  sellValue?: string;
  updateSwapStateAmount: (mode: "buy" | "sell", amount: string) => void;
}) {
  const {balances, balancesPending, refetchBalances} = useBalances();

  const sellBalance = useMemo(
    () =>
      balances?.find((b) => b.assetId === swapState.sell.assetId)?.amount ??
      bn(0),
    [balances, swapState.sell.assetId]
  );

  const buyBalance = useMemo(
    () =>
      balances?.find((b) => b.assetId === swapState.buy.assetId)?.amount ??
      bn(0),
    [balances, swapState.buy.assetId]
  );

  const sellMetadata = useAssetMetadata(swapState.sell.assetId);
  const buyMetadata = useAssetMetadata(swapState.buy.assetId);

  // HACK: This is a bit of an ugly way to set document titles
  useDocumentTitle(`Swap: ${sellMetadata.symbol} to ${buyMetadata.symbol}`);

  const isValidNetwork = useCheckActiveNetwork();
  const {
    trade,
    tradeState,
    error: previewError,
  } = useSwapPreview(swapState, activeMode);

  const pools = useMemo(
    () => trade?.bestRoute?.pools.map((p) => p.poolId) ?? [],
    [trade?.bestRoute?.pools]
  );

  const anotherMode = activeMode === "sell" ? "buy" : "sell";
  const decimals = useMemo(
    () =>
      anotherMode === "sell" ? sellMetadata.decimals : buyMetadata.decimals,
    [anotherMode, sellMetadata.decimals, buyMetadata.decimals]
  );

  const previewValueString = useMemo(() => {
    if (
      !trade ||
      tradeState !== TradeState.VALID ||
      !trade.amountIn ||
      trade.amountIn.eq(0) ||
      !trade.amountOut ||
      trade.amountOut.eq(0) ||
      !decimals
    ) {
      return "";
    }
    return activeMode === "sell"
      ? trade.amountOut.formatUnits(decimals)
      : trade.amountIn.formatUnits(decimals);
  }, [trade, tradeState, activeMode, decimals]);

  // Auto-update opposite amount based on preview
  useEffect(() => {
    if (!previewValueString) return;
    updateSwapStateAmount(anotherMode, previewValueString);
  }, [previewValueString, anotherMode, updateSwapStateAmount]);

  const sufficientEthBalance = useCheckEthBalance(swapState.sell);
  const exchangeRate = useExchangeRate(swapState);

  const {reservesPrice} = useReservesPrice({
    pools,
    sellAssetId: swapState.sell.assetId,
    buyAssetId: swapState.buy.assetId,
  });

  const previewPrice = useMemo(
    () => calculatePreviewPrice(swapState.sell.amount, swapState.buy.amount),
    [swapState.sell.amount, swapState.buy.amount]
  );

  const sellAssetPrice = useAssetPrice(swapState.sell.assetId);
  const buyAssetPrice = useAssetPrice(swapState.buy.assetId);

  const feePercent = useMemo(
    () => calculateFeePercent(trade?.bestRoute?.pools),
    [trade?.bestRoute?.pools]
  );

  const feeValue = useMemo(
    () => calculateFeeValue(sellValue, feePercent, sellMetadata.decimals),
    [sellValue, feePercent, sellMetadata.decimals]
  );

  return {
    balances,
    balancesPending,
    refetchBalances,
    sellBalance,
    buyBalance,
    sellMetadata,
    buyMetadata,
    isValidNetwork,
    trade,
    tradeState,
    previewError,
    pools,
    sufficientEthBalance,
    exchangeRate,
    reservesPrice,
    previewPrice,
    sellAssetPrice,
    buyAssetPrice,
    feePercent,
    feeValue,
  };
}
