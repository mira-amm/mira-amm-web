import {CoinName, coinsConfig} from "@/src/utils/coinsConfig";
import {B256Address} from "fuels";
import {buildPoolId, PoolId} from "mira-dex-ts";
import {AssetIdInput} from "mira-dex-ts/dist/sdk/typegen/MiraAmmContract";

export const openNewTab = (url: string) => {
  window.open(url, '_blank');
};

export const getCoinsFromKey = (key: string) => {
  const [coinA, coinB] = key.split('-') as [CoinName, CoinName];
  return { coinA , coinB };
};

export const getCoinByAssetId = (assetId: B256Address) => {
  return Array.from(coinsConfig.values()).find(coin => coin.assetId === assetId)?.name!;
};

export const getCoinsFromPoolId = (poolId: PoolId) => {
  const coinA = getCoinByAssetId(poolId[0].bits);
  const coinB = getCoinByAssetId(poolId[1].bits);
  return { coinA , coinB };
};

export const createPoolKey = (poolId: PoolId) => {
  const coinA = getCoinByAssetId(poolId[0].bits);
  const coinB = getCoinByAssetId(poolId[1].bits);
  return `${coinA}-${coinB}`;
};

export const isPoolKeyValid = (key: string) => {
  const [coinA, coinB] = key.split('-') as [CoinName, CoinName];
  return coinsConfig.has(coinA) && coinsConfig.has(coinB);
};

export const createPoolIdFromCoins = (coinA: CoinName, coinB: CoinName) => {
  const firstCoinAssetId = coinsConfig.get(coinA)?.assetId!;
  const secondCoinAssetId = coinsConfig.get(coinB)?.assetId!;
  return buildPoolId(firstCoinAssetId, secondCoinAssetId, false);
};

// Mira API returns pool id as string '0x3f007b72f7bcb9b1e9abe2c76e63790cd574b7c34f1c91d6c2f407a5b55676b9_0xce90621a26908325c42e95acbbb358ca671a9a7b36dfb6a5405b407ad1efcd30_false'
export const createPoolIdFromIdString = (id: string) => {
  const [firstAssetId, secondAssetId, isStable] = id.split('_');
  return buildPoolId(firstAssetId, secondAssetId, isStable === 'true');
};

export const createPoolIdString = (poolId: PoolId) => {
  return `${poolId[0].bits}_${poolId[1].bits}_${poolId[2]}`;
};

export const arePoolIdsEqual = (firstPoolId: PoolId, secondPoolId: PoolId) => {
  return (
    firstPoolId[0].bits === secondPoolId[0].bits &&
    firstPoolId[1].bits === secondPoolId[1].bits &&
    firstPoolId[2] === secondPoolId[2]
  );
};

export const floorToTwoSignificantDigits = (value: number | null | undefined) => {
  if (!value) {
    return 0;
  }

  const digitsBeforeDecimal = Math.floor(Math.log10(Math.abs(value))) + 1;
  const factor = Math.pow(10, 2 - digitsBeforeDecimal);

  return Math.floor(value * factor) / factor;
};
