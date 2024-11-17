import {ValidNetworkChainId} from "@/src/utils/constants";

import assets from './verified-assets.json';

// TODO: Consider removing this type as we won't probably know the list of all coins ahead of time
export type CoinName = string | null;

export interface CoinData {
  name: string;
  assetId: string;
  decimals: number;
  symbol: string;
  icon?: string;
  contractId?: string;
  subId?: string;
  l1Address?: string;
};

export interface CoinDataWithPrice extends CoinData {
  price: number;
};

export const assetSymbolToCoinGeckoId: { [key: string]: string } = {
  'ETH': "ethereum",
  'WETH': "weth",
  'weETH': "wrapped-eeth",
  'rsETH': "kelp-dao-restaked-eth",
  'rETH': "rocket-pool-eth",
  'wbETH': "wrapped-beacon-eth",
  'rstETH': "wrapped-steth",
  'amphrETH': "wrapped-steth",
  'Manta mBTC': "manta-mbtc",
  'Manta mETH': "manta-meth",
  'Manta mUSD': "manta-musd",
  // 'pumpBTC': "wrapped-bitcoin", // #TODO 'pumpbtc' ?
  'FBTC': "ignition-fbtc",
  'SolvBTC': "solv-btc",
  'SolvBTC.BBN': "solv-protocol-solvbtc-bbn",
  'Mantle mETH': "mantle-staked-ether",
  'sDAI': "savings-dai",
  'USDT': "tether",
  'USDC': "usd-coin",
  'USDe': "ethena-usde",
  'sUSDe': "ethena-staked-usde",
  'rsUSDe': "ethena-staked-usde",
  'wstETH': "wrapped-steth",
  'ezETH': "renzo-restaked-eth",
  'pzETH': "renzo-restaked-lst",
  'Re7LRT': "wrapped-steth",
  // 'steakLRT': "wrapped-steth", // TODO steakhouse-resteaking-vault ?
}

// mapping of asset names & symbols to symbols
export const assetHandleToSymbol: { [key: string]: string } = {};
export const verifiedAssetIds = new Set<string>();

// TODO: Make an API call to get the coins config
const initAssetsConfig = () => {
  const assetsConfig: Map<string, CoinData> = new Map();

  assets.forEach((asset) => {
    const currentFuelNetworkData = asset.networks.filter(network => network.type === 'fuel' && network.chainId === ValidNetworkChainId);
    const assetData: CoinData = {
      symbol: asset.symbol,
      assetId: currentFuelNetworkData[0].assetId!,
      decimals: currentFuelNetworkData[0].decimals,
      name: asset.name,
      icon: asset.icon,
      // @ts-ignore
      contractId: currentFuelNetworkData[0].contractId,
      // @ts-ignore
      subId: currentFuelNetworkData[0].subId,
    }

    assetsConfig.set(assetData.assetId, assetData);
  });

  const additionalAssetsConfig = initAdditionalAssetsConfig();

  additionalAssetsConfig.forEach((value, assetId) => {
    assetsConfig.set(assetId, value);
  });

  Array.from(assetsConfig.values()).forEach(asset => {
    if (asset.name) {
      assetHandleToSymbol[asset.name] = asset.name;
      assetHandleToSymbol[asset.symbol] = asset.name;
    }
    verifiedAssetIds.add(asset.assetId);
  });

  return assetsConfig;
};

const initAdditionalAssetsConfig = () => {
  const assetsConfig: Map<string, CoinData> = new Map();

  // place for additional assets
  const additionalAssets: CoinData[] = [
    {
      symbol: 'PSYCHO',
      assetId: '0x86fa05e9fef64f76fa61c03f5906c87a03cb9148120b6171910566173d36fc9e',
      decimals: 9,
      name: 'Psycho Ducky',
      icon: 'https://mira-dex-resources.s3.us-east-1.amazonaws.com/icons/psycho-icon.png',
      contractId: '0x81d5964bfbb24fd994591cc7d0a4137458d746ac0eb7ececb9a9cf2ae966d942',
      subId: '0x0000000000000000000000000000000000000000000000000000000000000031',
    },
    {
      symbol: 'MEOW',
      assetId: '0x6ff822c3231932e232aad8ec62931f7a1f3a9653b25c75dd5609c75d03b228b7',
      decimals: 9,
      name: 'Meow Meow',
      icon: 'https://mira-dex-resources.s3.us-east-1.amazonaws.com/icons/meow-sm.jpg',
      contractId: '0x81d5964bfbb24fd994591cc7d0a4137458d746ac0eb7ececb9a9cf2ae966d942',
      subId: '0x0000000000000000000000000000000000000000000000000000000000000061',
    },
    {
      symbol: 'FPEPE',
      assetId: '0x7fb205b0048b5f17513355351b6be75eec086e26748a3a94dbe3dcca37d55814',
      decimals: 9,
      name: 'Fuel Pepe',
      icon: 'https://mira-dex-resources.s3.us-east-1.amazonaws.com/icons/fpepe.jpg',
      contractId: '0x81d5964bfbb24fd994591cc7d0a4137458d746ac0eb7ececb9a9cf2ae966d942',
      subId: '0x0000000000000000000000000000000000000000000000000000000000000023',
    },
  ];

  for (const asset of additionalAssets) {
    assetsConfig.set(asset.assetId, asset);
  }

  return assetsConfig;
}

export const coinsConfig: Map<CoinName, CoinData> = initAssetsConfig();
