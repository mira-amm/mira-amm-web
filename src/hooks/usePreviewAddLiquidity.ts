import {useQuery} from "@tanstack/react-query";
import {CoinName, coinsConfig} from "@/src/utils/coinsConfig";
import {createAssetIdInput} from "@/src/utils/common";
import useReadonlyMira from "@/src/hooks/useReadonlyMira";
import {PoolId} from "mira-dex-ts";

type Props = {
  firstCoin: CoinName;
  secondCoin: CoinName;
  amount: number;
  isFirstToken: boolean;
};

const usePreviewAddLiquidity = ({ firstCoin, secondCoin, amount, isFirstToken }: Props) => {
  const mira = useReadonlyMira();
  const miraExists = Boolean(mira);

  const firstCoinAssetIdInput = createAssetIdInput(firstCoin);
  const secondCoinAssetIdInput = createAssetIdInput(secondCoin);

  const poolId: PoolId = [firstCoinAssetIdInput, secondCoinAssetIdInput, false];

  const decimals = coinsConfig.get(firstCoin)?.decimals!;
  const amountValid = amount !== null && !isNaN(amount);
  const amountToUse = amountValid ? amount * 10 ** decimals : 0;

  const shouldFetch = miraExists && amountToUse !== 0;

  const { data, isFetching } = useQuery({
    queryKey: ['preview-add-liquidity', poolId, amount, isFirstToken],
    queryFn: () => mira?.getOtherTokenToAddLiquidity(poolId, amount, isFirstToken),
    enabled: shouldFetch,
  })

  return { data, isFetching };
};

export default usePreviewAddLiquidity;
