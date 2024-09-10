import {CoinName, coinsConfig} from "@/src/utils/coinsConfig";
import {B256Address} from "fuels";
import {PoolId} from "mira-dex-ts";
import {AssetIdInput} from "mira-dex-ts/dist/sdk/typegen/MiraAmmContract";

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

export const getCoinByAssetId = (assetId: B256Address) => {
  return Array.from(coinsConfig.values()).find(coin => coin.assetId === assetId)?.name!;
};

export const getCoinsFromPool = (poolId: PoolId) => {
  const coinA = getCoinByAssetId(poolId[0].bits);
  const coinB = getCoinByAssetId(poolId[1].bits);
  return { coinA , coinB };
};

export const createPoolKey = (poolId: PoolId) => {
  const coinA = getCoinByAssetId(poolId[0].bits);
  const coinB = getCoinByAssetId(poolId[1].bits);
  return `${coinA}-${coinB}`;
};

export const createPoolId = (coinA: CoinName, coinB: CoinName) => {
  const assetIdInputA = createAssetIdInput(coinA);
  const assetIdInputB = createAssetIdInput(coinB);
  return [assetIdInputA, assetIdInputB, false] as PoolId;
}

export const isPoolKeyValid = (key: string) => {
  const [coinA, coinB] = key.split('-') as [CoinName, CoinName];
  return coinsConfig.has(coinA) && coinsConfig.has(coinB);
};
