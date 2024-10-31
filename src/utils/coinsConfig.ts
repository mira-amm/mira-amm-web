import {ValidNetworkChainId} from "@/src/utils/constants";

import assets from './verified-assets.json';

// TODO: Consider removing this type as we won't probably know the list of all coins ahead of time
export type CoinName = 'ETH' | 'USDC' | 'USDT' | null;

type CoinData = {
  name: CoinName;
  assetId: string;
  decimals: number;
  fullName: string;
  isVerified: boolean;
  icon?: string;
  contractId?: string;
  subId?: string;
  coinGeckoId?: string;
};

// mapping of asset names & symbols to symbols
export const assetHandleToSymbol = new Map<string, string>();

// TODO: Make an API call to get the coins config
const initAssetsConfig = () => {
  const assetsConfig = new Map<CoinName, CoinData>();

  assets.forEach((asset) => {
    // const currentFuelNetworkData = asset.networks.filter(network => network.type === 'fuel' && network.chainId === ValidNetworkChainId);
    const assetData: CoinData = {
      name: asset.symbol as CoinName,
      assetId: asset.assetId!,
      decimals: asset.decimals,
      fullName: asset.name,
      icon: asset.icon.default,
      isVerified: asset.isVerified,
      contractId: asset.contractId,
      subId: asset.subId,
      coinGeckoId: asset.externalIds?.coinGecko,
    };

    assetsConfig.set(asset.symbol as CoinName, assetData);
  });

  const additionalAssetsConfig = initAdditionalAssetsConfig();

  additionalAssetsConfig.forEach((value, key) => {
    assetsConfig.set(key, value);
  });

  Array.from(assetsConfig.values()).forEach(asset => {
    if (asset.name) {
      assetHandleToSymbol.set(asset.name, asset.name);
      assetHandleToSymbol.set(asset.fullName, asset.name);
    }
  });

  return assetsConfig;
};

const initAdditionalAssetsConfig = () => {
  const assetsConfig: Map<CoinName, CoinData> = new Map();

  // place for additional assets
  const additionalAssets: CoinData[] = [
    {
      name: 'PSYCHO' as CoinName,
      assetId: '0x86fa05e9fef64f76fa61c03f5906c87a03cb9148120b6171910566173d36fc9e',
      decimals: 9,
      fullName: 'Psycho Ducky',
      icon: 'https://mira-dex-resources.s3.us-east-1.amazonaws.com/icons/psycho-icon.png',
      contractId: '0x81d5964bfbb24fd994591cc7d0a4137458d746ac0eb7ececb9a9cf2ae966d942',
      subId: '0x0000000000000000000000000000000000000000000000000000000000000031',
      isVerified: false,
    },
    {
      name: 'MEOW' as CoinName,
      assetId: '0x6ff822c3231932e232aad8ec62931f7a1f3a9653b25c75dd5609c75d03b228b7',
      decimals: 9,
      fullName: 'Meow Meow',
      icon: 'https://mira-dex-resources.s3.us-east-1.amazonaws.com/icons/meow-sm.jpg',
      contractId: '0x81d5964bfbb24fd994591cc7d0a4137458d746ac0eb7ececb9a9cf2ae966d942',
      subId: '0x0000000000000000000000000000000000000000000000000000000000000061',
      isVerified: false,
    },
    {
      name: 'FPEPE' as CoinName,
      assetId: '0x7fb205b0048b5f17513355351b6be75eec086e26748a3a94dbe3dcca37d55814',
      decimals: 9,
      fullName: 'Fuel Pepe',
      icon: 'https://mira-dex-resources.s3.us-east-1.amazonaws.com/icons/fpepe.jpg',
      contractId: '0x81d5964bfbb24fd994591cc7d0a4137458d746ac0eb7ececb9a9cf2ae966d942',
      subId: '0x0000000000000000000000000000000000000000000000000000000000000023',
      isVerified: false,
    },
  ];

  for (const asset of additionalAssets) {
    assetsConfig.set(asset.name, asset);
  }

  return assetsConfig;
}

export const coinsConfig: Map<CoinName, CoinData> = initAssetsConfig();
