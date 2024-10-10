import { useQuery } from "@tanstack/react-query";
import { CurrencyBoxMode, SwapState } from "@/src/components/common/Swap/Swap";
import useSwapData from "@/src/hooks/useAssetPair/useSwapData";
import useReadonlyMira from "@/src/hooks/useReadonlyMira";
import { buildPoolId, PoolId } from "mira-dex-ts";
import { ApiBaseUrl } from "@/src/utils/constants";
import { InsufficientReservesError } from "mira-dex-ts/dist/sdk/errors";
import stringify from "fast-safe-stringify";
import stable = stringify.stable;

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

  const { data: multihopPreviewData, error: multihopPreviewError, isFetching: multihopPreviewFetching, failureCount: multihopFailureCount } = useQuery({
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
          throw new Error('No route found');
        }

        throw new Error('An error occurred while retrieving the path');
      }

      return await res.json();
    },
    retry: (failureCount, error) => {
      if (error.message === 'No route found') {
        return false;
      }

      return failureCount < 1;
    },
    retryDelay: 1000,
    enabled: amountNonZero,
  });

  const miraAmm = useReadonlyMira();
  const miraExists = Boolean(miraAmm);
  const volatilePool = buildPoolId(inputAssetId, outputAssetId, false);
  const stablePool = buildPoolId(inputAssetId, outputAssetId, true);
  const shouldFetchFallback =
    Boolean(multihopPreviewError) !== null && multihopFailureCount === 2 && miraExists && amountNonZero;

  const { data: fallbackPreviewData, error: fallbackPreviewError, isFetching: fallbackPreviewFetching } = useQuery({
    queryKey: ['fallbackPreview', inputAssetId, outputAssetId, normalizedAmount],
    queryFn: async () => {
      return mode === 'sell' ?
        await miraAmm?.previewSwapExactInput(
          sellAssetIdInput,
          normalizedAmount,
          [volatilePool, stablePool],
        ) :
        await miraAmm?.previewSwapExactOutput(
          buyAssetIdInput,
          normalizedAmount,
          [volatilePool, stablePool],
        );
    },
    enabled: shouldFetchFallback,
    retry: (failureCount, error) => {
      if (error instanceof InsufficientReservesError) {
        return false;
      }

      return failureCount < 1;
    },
    retryDelay: 1000,
  });

  let previewData: SwapPreviewData | null = null;
  if (multihopPreviewData) {
    const { path, input_amount, output_amount } = multihopPreviewData as MultihopPreviewData;
    previewData = {
      pools: path.map(([input, output, stable]) => buildPoolId(`0x${input}`, `0x${output}`, stable)),
      previewAmount: mode === 'sell' ? output_amount : input_amount,
    };
  } else if (fallbackPreviewData) {
    previewData = {
      pools: [volatilePool, stablePool],
      previewAmount: fallbackPreviewData[1].toNumber(),
    };
  }

  const previewError = !previewData ? fallbackPreviewError || multihopPreviewError : null;

  return {
    previewData,
    previewFetching: multihopPreviewFetching || fallbackPreviewFetching,
    previewError,
  };
};

export default useSwapPreview;
