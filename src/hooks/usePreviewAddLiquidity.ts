import {useQuery} from "@tanstack/react-query";
import {CoinName, coinsConfig} from "@/src/utils/coinsConfig";
import useReadonlyMira from "@/src/hooks/useReadonlyMira";
import {buildPoolId, PoolId} from "mira-dex-ts";

type Props = {
  firstCoin: CoinName;
  secondCoin: CoinName;
  amountString: string;
  isFirstToken: boolean;
  isStablePool: boolean;
  fetchCondition?: boolean;
};

const usePreviewAddLiquidity = ({ firstCoin, secondCoin, amountString, isFirstToken, isStablePool, fetchCondition = true }: Props) => {
  const mira = useReadonlyMira();
  const miraExists = Boolean(mira);

  const firstCoinAssetId = coinsConfig.get(firstCoin)?.assetId!;
  const secondCoinAssetId = coinsConfig.get(secondCoin)?.assetId!;

  const pool: PoolId = buildPoolId(firstCoinAssetId, secondCoinAssetId, isStablePool);

  const coinForDecimals = isFirstToken ? firstCoin : secondCoin;
  const decimals = coinsConfig.get(coinForDecimals)?.decimals!;

  const amount = parseFloat(amountString);
  const amountToUse = !isNaN(amount) ? amount * 10 ** decimals : 0;

  const shouldFetch = fetchCondition && miraExists && amountToUse !== 0;

  const { data, isFetching, error } = useQuery({
    queryKey: ['preview-add-liquidity', firstCoinAssetId, secondCoinAssetId, isStablePool, amountToUse, isFirstToken],
    queryFn: () => mira?.getOtherTokenToAddLiquidity(pool, amountToUse, isFirstToken),
    enabled: shouldFetch,
  })

  return { data, isFetching, error };
};

export default usePreviewAddLiquidity;
