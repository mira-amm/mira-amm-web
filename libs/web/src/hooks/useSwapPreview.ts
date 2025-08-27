import {useMemo} from "react";
import {BN, bn} from "fuels";
import {CurrencyBoxMode, SwapState} from "@/src/components/common/Swap/Swap";
import {
  useSwapData,
  useAsset,
  useDebounce,
  useSwapRouter,
  TradeType,
  TradeState,
} from "@/src/hooks";
import {type Route} from "@/src/hooks";
import {type PoolTypeOption} from "@/src/components/common/PoolTypeToggle";

export function useSwapPreview(
  swapState: SwapState,
  mode: CurrencyBoxMode,
  poolType: PoolTypeOption = "v1"
): {
  tradeState: TradeState;
  trade?: {
    bestRoute: Route;
    amountIn: BN;
    amountOut: BN;
  };
  error: string | null;
} {
  const {sellAssetId, buyAssetId} = useSwapData(swapState);
  const {asset: assetIn} = useAsset(sellAssetId);
  const {asset: assetOut} = useAsset(buyAssetId);

  const tradeType = mode === "buy" ? TradeType.EXACT_OUT : TradeType.EXACT_IN;

  const rawUserInputAmount = useMemo(() => {
    const amountString =
      tradeType === TradeType.EXACT_IN
        ? swapState.sell.amount
        : swapState.buy.amount;
    const amount = parseFloat(amountString);
    const amountValid = !isNaN(amount);
    if (!assetIn || !assetOut) return bn(0);
    const decimals =
      tradeType === TradeType.EXACT_IN ? assetIn.decimals : assetOut.decimals;

    try {
      return amountValid ? bn.parseUnits(amountString, decimals) : bn(0);
    } catch (error) {
      console.error("Error parsing units:", error);
      return bn(0);
    }
  }, [
    assetIn,
    assetOut,
    swapState.buy.amount,
    swapState.sell.amount,
    tradeType,
  ]);

  // passing as bn causes infinite render
  const debouncedValue = useDebounce(rawUserInputAmount.toString(), 100);

  // For now, v2 pools will use the same router but with different caching strategy
  // TODO: Implement v2-specific routing when v2 pools are available
  const cacheOptions = useMemo(
    () => ({
      enableCaching: true,
      // v2 pools might need different cache settings
      poolDataTTL: poolType === "v2" ? 15000 : 30000, // Shorter TTL for v2 due to more dynamic pricing
      refreshInterval: poolType === "v2" ? 30000 : 60000,
    }),
    [poolType]
  );

  const result = useSwapRouter(
    tradeType,
    bn(debouncedValue),
    assetIn,
    assetOut,
    cacheOptions
  );

  // For v2 pools, we might need to show a different error message when no routes are found
  return useMemo(() => {
    if (poolType === "v2" && result.tradeState === TradeState.NO_ROUTE_FOUND) {
      return {
        ...result,
        error: "No concentrated liquidity pools available for this pair",
      };
    }
    return result;
  }, [result, poolType]);
}
