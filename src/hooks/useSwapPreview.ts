import {useQuery, useQueryClient} from "@tanstack/react-query";
import {CurrencyBoxMode, SwapState} from "@/src/components/common/Swap/Swap";
import useSwapData from "@/src/hooks/useAssetPair/useSwapData";
import useReadonlyMira from "@/src/hooks/useReadonlyMira";
import {buildPoolId, PoolId, Asset} from "mira-dex-ts";
import {ApiBaseUrl} from "@/src/utils/constants";
import {InsufficientReservesError} from "mira-dex-ts/dist/sdk/errors";

type Props = {
  swapState: SwapState;
  mode: CurrencyBoxMode;
}

type TradeType = 'ExactInput' | 'ExactOutput';

type MultihopPreviewData = {
  path: [string, string, boolean][];
  input_amount: number;
  output_amount: number;
};

type SwapPreviewData = {
  pools: PoolId[];
  previewAmount: number;
};

export class NoRouteFoundError extends Error {
  constructor() {
    super('No route found');
  }
}

const useSwapPreview = ({ swapState, mode }: Props) => {
  const {
    sellAssetIdInput,
    buyAssetIdInput,
    sellDecimals,
    buyDecimals,
  } = useSwapData(swapState);
  const inputAssetId = sellAssetIdInput.bits;
  const outputAssetId = buyAssetIdInput.bits;

  const amountString = mode === 'sell' ? swapState.sell.amount : swapState.buy.amount;
  const amount = parseFloat(amountString);
  const amountValid = !isNaN(amount);
  const decimals = mode === 'sell' ? sellDecimals : buyDecimals;
  const normalizedAmount = amountValid ? amount * 10 ** decimals : 0;
  const amountNonZero = normalizedAmount > 0;

  const tradeType: TradeType = mode === 'sell' ? 'ExactInput' : 'ExactOutput';

  const { data: multihopPreviewData, error: multihopPreviewError, isLoading: multihopPreviewLoading, failureCount: multihopFailureCount } = useQuery({
    queryKey: ['multihopPreview', inputAssetId, outputAssetId, normalizedAmount, tradeType],
    queryFn: async () => {
      const res = await fetch(`${ApiBaseUrl}/find_route`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: inputAssetId,
          output: outputAssetId,
          amount: normalizedAmount,
          trade_type: tradeType,
        }),
      });

      if (!res.ok) {
        if (res.status === 404) {
          throw new NoRouteFoundError();
        }

        throw new Error('An error occurred while retrieving the path');
      }

      return await res.json();
    },
    retry: (failureCount, error) => {
      if (error instanceof NoRouteFoundError) {
        return false;
      }

      return failureCount < 1;
    },
    retryDelay: 1000,
    enabled: amountNonZero,
    // refetchInterval: 1000,
  });

  const miraAmm = useReadonlyMira();
  const miraExists = Boolean(miraAmm);
  const volatilePool = buildPoolId(inputAssetId, outputAssetId, false);
  const stablePool = buildPoolId(inputAssetId, outputAssetId, true);
  const shouldFetchFallback =
    Boolean(multihopPreviewError) && multihopFailureCount === 2 && miraExists && amountNonZero;

  async function getFallbackPoolId(): Promise<PoolId | undefined> {
    try {
      const volatileMeta = await miraAmm?.poolMetadata(volatilePool).catch(() => undefined);
      const stableMeta = await miraAmm?.poolMetadata(stablePool).catch(() => undefined);

      if (!volatileMeta && !stableMeta) {
        return undefined;
      }

      if (!volatileMeta) return stablePool;
      if (!stableMeta) return volatilePool;

      const volatileReservesProduct = volatileMeta.reserve0.mul(volatileMeta.reserve1);
      const stableReservesProduct = stableMeta.reserve0.mul(stableMeta.reserve1);

      return volatileReservesProduct >= stableReservesProduct ? volatilePool : stablePool;
    } catch (error) {
      console.error('Error determining fallback pool:', error);
      return undefined;
    }
  }

  const { data: fallbackPreviewData, error: fallbackPreviewError, isLoading: fallbackPreviewLoading } = useQuery({
    queryKey: ['fallbackPreview', inputAssetId, outputAssetId, normalizedAmount],
    queryFn: async () => {
      const fallbackPoolId = await getFallbackPoolId();

      if (!fallbackPoolId) {
        throw new NoRouteFoundError();
      }

      const fallbackPreviewResponse = mode === 'sell' ?
        await miraAmm?.previewSwapExactInput(
          sellAssetIdInput,
          normalizedAmount,
          [fallbackPoolId],
        ) :
        await miraAmm?.previewSwapExactOutput(
          buyAssetIdInput,
          normalizedAmount,
          [fallbackPoolId],
        );

      if (!fallbackPreviewResponse) {
        return;
      }

      return [fallbackPreviewResponse, fallbackPoolId] as [Asset, PoolId];
    },
    enabled: shouldFetchFallback,
    retry: (failureCount, error) => {
      if (error instanceof InsufficientReservesError || error instanceof NoRouteFoundError) {
        return false;
      }

      return failureCount < 1;
    },
    retryDelay: 1000,
    // refetchInterval: 15000,
  });

  let previewData: SwapPreviewData | null = null;
  if (multihopPreviewData) {
    const { path, input_amount, output_amount } = multihopPreviewData as MultihopPreviewData;
    previewData = {
      pools: path.map(([input, output, stable]) => buildPoolId(`0x${input}`, `0x${output}`, stable)),
      previewAmount: mode === 'sell' ? output_amount : input_amount,
    };
  } else if (fallbackPreviewData) {
    const [fallbackPreviewResponse, fallbackPoolId] = fallbackPreviewData;
    previewData = {
      pools: [fallbackPoolId],
      previewAmount: fallbackPreviewResponse[1].toNumber(),
    };
  }

  const previewError = !previewData ? fallbackPreviewError || multihopPreviewError : null;

  return {
    previewData,
    previewLoading: multihopPreviewLoading || fallbackPreviewLoading,
    previewError,
  };
};

export default useSwapPreview;
