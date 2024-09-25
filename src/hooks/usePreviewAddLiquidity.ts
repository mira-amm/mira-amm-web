import {useQuery} from "@tanstack/react-query";
import {CoinName, coinsConfig} from "@/src/utils/coinsConfig";
import useReadonlyMira from "@/src/hooks/useReadonlyMira";
import {buildPoolId, PoolId} from "mira-dex-ts";

type Props = {
  firstCoin: CoinName;
  secondCoin: CoinName;
  amount: number;
  isFirstToken: boolean;
};

const usePreviewAddLiquidity = ({ firstCoin, secondCoin, amount, isFirstToken }: Props) => {
  const mira = useReadonlyMira();
  const miraExists = Boolean(mira);

  const firstCoinAssetId = coinsConfig.get(firstCoin)?.assetId!;
  const secondCoinAssetId = coinsConfig.get(secondCoin)?.assetId!;

  const pool: PoolId = buildPoolId(firstCoinAssetId, secondCoinAssetId, false);

  const coinForDecimals = isFirstToken ? firstCoin : secondCoin;
  const decimals = coinsConfig.get(coinForDecimals)?.decimals!;

  const amountValid = amount !== null && !isNaN(amount);
  const amountToUse = amountValid ? amount * 10 ** decimals : 0;

  const shouldFetch = miraExists && amountToUse !== 0;

  const { data, isFetching } = useQuery({
    queryKey: ['preview-add-liquidity', pool, amountToUse, isFirstToken],
    queryFn: () => mira?.getOtherTokenToAddLiquidity(pool, amountToUse, isFirstToken),
    enabled: shouldFetch,
  })

  return { data, isFetching };
};

export default usePreviewAddLiquidity;
