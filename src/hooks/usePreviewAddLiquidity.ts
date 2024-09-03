import useMiraDex from "@/src/hooks/useMiraDex/useMiraDex";
import {useQuery} from "@tanstack/react-query";
import type {AssetInput} from "mira-dex-ts/src/typegen/amm-contract/AmmContractAbi";
import {CoinName, coinsConfig} from "@/src/utils/coinsConfig";
import {DefaultTxParams} from "@/src/utils/constants";
import {createAssetIdInput} from "@/src/utils/common";

type Props = {
  firstCoin: CoinName;
  secondCoin: CoinName;
  amount: number;
  activeCoin: CoinName;
};

const usePreviewAddLiquidity = ({ firstCoin, secondCoin, amount, activeCoin }: Props) => {
  const mira = useMiraDex();
  const miraExists = Boolean(mira);

  const firstCoinAssetIdInput = createAssetIdInput(firstCoin);
  const secondCoinAssetIdInput = createAssetIdInput(secondCoin);

  const decimals = coinsConfig.get(firstCoin)?.decimals!;
  const amountValid = amount !== null && !isNaN(amount);
  const amountToUse = amountValid ? amount * 10 ** decimals : 0;

  const assetInput: AssetInput = {
    id: activeCoin === firstCoin ? firstCoinAssetIdInput : secondCoinAssetIdInput,
    amount: amountToUse,
  };

  const shouldFetch = miraExists && amountToUse !== 0;

  const { data, isFetching } = useQuery({
    queryKey: ['preview-add-liquidity', firstCoin, secondCoin, amount],
    queryFn: () => mira?.previewAddLiquidity([firstCoinAssetIdInput, secondCoinAssetIdInput], assetInput, DefaultTxParams),
    enabled: shouldFetch,
  })

  return { data, isFetching };
};

export default usePreviewAddLiquidity;
