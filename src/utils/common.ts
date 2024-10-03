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

export const getAssetNameByAssetId = (assetId: B256Address) => {
  return Array.from(coinsConfig.values()).find(coin => coin.assetId === assetId)?.name!;
};

export const getAssetNamesFromPoolId = (poolId: PoolId) => {
  const firstAssetName = getAssetNameByAssetId(poolId[0].bits);
  const secondAssetName = getAssetNameByAssetId(poolId[1].bits);
  return { firstAssetName, secondAssetName };
};

export const StablePoolKey = 'stable' as const;
export const VolatilePoolKey = 'volatile' as const;

// Entity used as query param for position/pool pages in format 'ETH-USDT-stable', mutually convertible with pool id
export const createPoolKey = (poolId: PoolId) => {
  const firstAssetName = getAssetNameByAssetId(poolId[0].bits);
  const secondAssetName = getAssetNameByAssetId(poolId[1].bits);
  const poolStability = poolId[2] ? StablePoolKey : VolatilePoolKey;
  return `${firstAssetName}-${secondAssetName}-${poolStability}`;
};

// TODO: Reconsider this function, maybe have an API call for /pools?
export const isPoolKeyValid = (key: string) => {
  const [coinA, coinB] = key.split('-') as [CoinName, CoinName];
  return coinsConfig.has(coinA) && coinsConfig.has(coinB);
};

export const createPoolIdFromPoolKey = (key: string) => {
  const [coinA, coinB, poolStability] = key.split('-') as [CoinName, CoinName, typeof StablePoolKey | typeof VolatilePoolKey];
  const firstCoinAssetId = coinsConfig.get(coinA)?.assetId!;
  const secondCoinAssetId = coinsConfig.get(coinB)?.assetId!;
  return buildPoolId(firstCoinAssetId, secondCoinAssetId, poolStability === StablePoolKey);
};

export const createPoolIdFromAssetNames = (firstAssetName: CoinName, secondAssetName: CoinName, isStablePool: boolean) => {
  const firstCoinAssetId = coinsConfig.get(firstAssetName)?.assetId!;
  const secondCoinAssetId = coinsConfig.get(secondAssetName)?.assetId!;
  return buildPoolId(firstCoinAssetId, secondCoinAssetId, isStablePool);
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
