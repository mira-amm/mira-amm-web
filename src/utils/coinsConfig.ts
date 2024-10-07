import {ValidNetworkChainId} from "@/src/utils/constants";

import assets from './verified-assets.json';

// TODO: Consider removing this type as we won't probably know the list of all coins ahead of time
export type CoinName = 'ETH' | 'USDC' | 'USDT' | null;

type CoinData = {
  name: CoinName;
  assetId: string;
  decimals: number;
  fullName?: string;
  icon?: string;
  contractId?: string;
  subId?: string;
};

// TODO: Make an API call to get the coins config
const initAssetsConfig = () => {
  const assetsConfig: Map<CoinName, CoinData> = new Map();

  assets.forEach((asset) => {
    const currentFuelNetworkData = asset.networks.filter(network => network.type === 'fuel' && network.chainId === ValidNetworkChainId);
    const assetData: CoinData = {
      name: asset.symbol as CoinName,
      assetId: currentFuelNetworkData[0].assetId!,
      decimals: currentFuelNetworkData[0].decimals,
      fullName: asset.name,
      icon: asset.icon,
      // @ts-ignore
      contractId: currentFuelNetworkData[0].contractId,
      // @ts-ignore
      subId: currentFuelNetworkData[0].subId,
    }

    assetsConfig.set(asset.symbol as CoinName, assetData);
  });

  return assetsConfig;
};

export const coinsConfig: Map<CoinName, CoinData> = initAssetsConfig();
