import {CoinName, coinsConfig} from "@/src/utils/coinsConfig";
import {AssetIdInput} from "mira-dex-ts/src/typegen/amm-contract/AmmContractAbi";

export const openNewTab = (url: string) => {
  window.open(url, '_blank');
};

export const getCoinsFromKey = (key: string) => {
  const [coinA, coinB] = key.split('-') as [CoinName, CoinName];
  return { coinA , coinB };
};

export const createAssetIdInput = (coin: CoinName) => {
  const assetIdInput: AssetIdInput = {
    bits: coinsConfig.get(coin)?.assetId!,
  };

  return assetIdInput;
};
