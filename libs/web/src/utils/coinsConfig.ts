import verifiedAssets from "./verified-assets.json";
import {getSelectedNetwork} from "@/src/stores/useNetworkStore";

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
  isVerified?: boolean;
  coinGeckoId?: string;
}

export interface CoinDataWithPrice extends CoinData {
  price: number;
}

// mapping of asset names & symbols to symbols
export const assetHandleToSymbol = new Map<string, string>();

// Helper function to get the appropriate network data based on chain ID
export const getNetworkDataForChain = (asset: any, chainId: number) => {
  // For local development (chainId 31337), look for local_testnet chain specifically
  if (chainId === 31337) {
    const localNetwork = asset.networks?.find(
      (network: any) =>
        network.type === "fuel" && network.chain === "local_testnet"
    );
    return localNetwork || null; // Return null if no local_testnet network found (don't fallback)
  }

  // For production/testnet, find the fuel network that matches the specified chain ID
  const fuelNetwork = asset.networks?.find(
    (network: any) => network.type === "fuel" && network.chainId === chainId
  );

  // If we find a matching fuel network, return it
  if (fuelNetwork) {
    return fuelNetwork;
  }

  // Fallback: try to find any fuel network (for backwards compatibility with mainnet)
  const anyFuelNetwork = asset.networks?.find(
    (network: any) => network.type === "fuel"
  );

  return anyFuelNetwork;
};

// TODO: Make an API call to get the coins config
const initAssetsConfig = () => {
  const assetsConfig: Map<string, CoinData> = new Map();

  // We'll only initialize with additional assets here
  // Verified assets will be handled dynamically by the hook
  const additionalAssetsConfig = initAdditionalAssetsConfig();

  additionalAssetsConfig.forEach((value, assetId) => {
    assetsConfig.set(assetId, value);
  });

  Array.from(assetsConfig.values()).forEach((asset) => {
    if (asset.name) {
      assetHandleToSymbol.set(asset.name, asset.name);
      assetHandleToSymbol.set(asset.symbol, asset.name);
    }
  });

  return assetsConfig;
};

const initAdditionalAssetsConfig = () => {
  const assetsConfig: Map<string, CoinData> = new Map();

  // place for additional assets
  const additionalAssets: CoinData[] = [
    {
      symbol: "PSYCHO",
      assetId:
        "0x86fa05e9fef64f76fa61c03f5906c87a03cb9148120b6171910566173d36fc9e",
      decimals: 9,
      name: "Psycho Ducky",
      icon: "https://mira-dex-resources.s3.us-east-1.amazonaws.com/icons/psycho-icon.png",
      contractId:
        "0x81d5964bfbb24fd994591cc7d0a4137458d746ac0eb7ececb9a9cf2ae966d942",
      subId:
        "0x0000000000000000000000000000000000000000000000000000000000000031",
      isVerified: false,
    },
    {
      symbol: "MEOW",
      assetId:
        "0x6ff822c3231932e232aad8ec62931f7a1f3a9653b25c75dd5609c75d03b228b7",
      decimals: 9,
      name: "Meow Meow",
      icon: "https://mira-dex-resources.s3.us-east-1.amazonaws.com/icons/meow-sm.jpg",
      contractId:
        "0x81d5964bfbb24fd994591cc7d0a4137458d746ac0eb7ececb9a9cf2ae966d942",
      subId:
        "0x0000000000000000000000000000000000000000000000000000000000000061",
      isVerified: false,
    },
    {
      symbol: "FPEPE",
      assetId:
        "0x7fb205b0048b5f17513355351b6be75eec086e26748a3a94dbe3dcca37d55814",
      decimals: 9,
      name: "Fuel Pepe",
      icon: "https://mira-dex-resources.s3.us-east-1.amazonaws.com/icons/fpepe.jpg",
      contractId:
        "0x81d5964bfbb24fd994591cc7d0a4137458d746ac0eb7ececb9a9cf2ae966d942",
      subId:
        "0x0000000000000000000000000000000000000000000000000000000000000023",
      isVerified: false,
    },
    {
      name: "Liquid Staked FUEL",
      symbol: "stFUEL",
      icon: "/images/stfuel.svg",
      decimals: 9,
      assetId:
        "0x5505d0f58bea82a052bc51d2f67ab82e9735f0a98ca5d064ecb964b8fd30c474",
      contractId:
        "0x2181f1b8e00756672515807cab7de10c70a9b472a4a9b1b6ca921435b0a1f49b",
      subId:
        "0x0000000000000000000000000000000000000000000000000000000000000000",
      isVerified: false,
    },
  ];

  for (const asset of additionalAssets) {
    assetsConfig.set(asset.assetId, asset);
  }

  return assetsConfig;
};

export const coinsConfig: Map<CoinName, CoinData> = initAssetsConfig();

// Routing configs

// Function to get asset ID from verified-assets.json based on symbol and environment
function getAssetIdFromVerifiedAssets(symbol: string): string {
  const asset = verifiedAssets.find((a: any) => a.symbol === symbol);
  if (!asset) {
    throw new Error(
      `Asset with symbol ${symbol} not found in verified-assets.json`
    );
  }

  const network = getSelectedNetwork();

  // For local development, look for local_testnet chain
  if (network === "local") {
    const localNetwork = asset.networks?.find(
      (n: any) =>
        n.type === "fuel" && n.chain === "local_testnet"
    );
    if (localNetwork?.assetId) {
      return localNetwork.assetId;
    }
    console.warn(
      `Local testnet asset ID not found for ${symbol}, falling back to mainnet`
    );
  }

  // For testnet, look for testnet chain
  if (network === "testnet") {
    const testnetNetwork = asset.networks?.find(
      (n: any) => n.type === "fuel" && n.chain === "testnet"
    );
    if (testnetNetwork?.assetId) {
      return testnetNetwork.assetId;
    }
  }

  // For mainnet (or fallback), find the mainnet fuel network (chainId 9889)
  const mainnetNetwork = asset.networks?.find(
    (n: any) => n.type === "fuel" && n.chainId === 9889
  );
  if (mainnetNetwork?.assetId) {
    return mainnetNetwork.assetId;
  }

  // Final fallback: any fuel network
  const anyFuelNetwork = asset.networks?.find(
    (n: any) => n.type === "fuel"
  );
  if (anyFuelNetwork?.assetId) {
    return anyFuelNetwork.assetId;
  }

  throw new Error(`No fuel network found for asset ${symbol}`);
}

export const BASE_ASSETS: CoinData[] = [
  {
    name: "Ethereum",
    symbol: "ETH",
    decimals: 9,
    assetId: getAssetIdFromVerifiedAssets("ETH"),
  },
  {
    name: "USDC",
    symbol: "USDC",
    decimals: 6,
    assetId: getAssetIdFromVerifiedAssets("USDC"),
  },
];
