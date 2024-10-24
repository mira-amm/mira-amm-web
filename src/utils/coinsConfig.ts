import {ValidNetworkChainId} from "@/src/utils/constants";

import assets from './verified-assets-day-1.json';

// TODO: Consider removing this type as we won't probably know the list of all coins ahead of time
export type CoinName = 'ETH' | 'USDC' | 'USDT' | null;

type CoinData = {
  name: CoinName;
  assetId: string;
  decimals: number;
  fullName: string;
  icon?: string;
  contractId?: string;
  subId?: string;
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

  const additionalAssetsConfig = initAdditionalAssetsConfig();

  additionalAssetsConfig.forEach((value, key) => {
    assetsConfig.set(key, value);
  });

  Array.from(assetsConfig.values()).forEach(asset => {
    if (asset.name) {
      assetHandleToSymbol[asset.name] = asset.name;
      assetHandleToSymbol[asset.fullName] = asset.name;
    }
    verifiedAssetIds.add(asset.assetId);
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
      icon: 'https://mira-dex-resources.s3.amazonaws.com/icons/ducky-icon.png', // TODO change
      contractId: '0xd2c72034938ce660e4cac0f0f24ff8a311efb1dbe03ccb8a8e3eaafa7ce47c7e',
      subId: '0x0000000000000000000000000000000000000000000000000000000000000000',
    }
  ];

  for (const asset of additionalAssets) {
    assetsConfig.set(asset.name, asset);
  }

  return assetsConfig;
}

export const coinsConfig: Map<CoinName, CoinData> = initAssetsConfig();
