import {useQuery} from "@tanstack/react-query";
import {CoinName, coinsConfig} from "@/src/utils/coinsConfig";
import useReadonlyMira from "@/src/hooks/useReadonlyMira";
import {buildPoolId, PoolId} from "mira-dex-ts";
import {BN} from "fuels";

type Props = {
  firstCoin: CoinName;
  secondCoin: CoinName;
  amount: BN;
  isFirstToken: boolean;
  isStablePool: boolean;
  fetchCondition?: boolean;
};

const usePreviewAddLiquidity = ({ firstCoin, secondCoin, amount, isFirstToken, isStablePool, fetchCondition = true }: Props) => {
  const mira = useReadonlyMira();
  const miraExists = Boolean(mira);

  const firstCoinAssetId = coinsConfig.get(firstCoin)?.assetId!;
  const secondCoinAssetId = coinsConfig.get(secondCoin)?.assetId!;

  const pool: PoolId = buildPoolId(firstCoinAssetId, secondCoinAssetId, isStablePool);

  const amountString = amount.toString();

  const shouldFetch = fetchCondition && miraExists && !amount.eq(0);

  const { data, isFetching, error } = useQuery({
    queryKey: ['preview-add-liquidity', firstCoinAssetId, secondCoinAssetId, isStablePool, amountString, isFirstToken],
    queryFn: () => mira?.getOtherTokenToAddLiquidity(pool, amount, isFirstToken),
    enabled: shouldFetch,
  })

  return { data, isFetching, error };
};

export default usePreviewAddLiquidity;
