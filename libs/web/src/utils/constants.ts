import {bn, BN, CHAIN_IDS, TxParams} from "fuels";
import {getBrandText} from "./brandName";
import verifiedAssets from "./verified-assets.json";

// Function to get local contract IDs when in local development
function getLocalContractIds() {
  // Environment variables are available in both server and client environments
  return {
    simpleProxy: process.env.NEXT_PUBLIC_LOCAL_PROXY_CONTRACT_ID,
    fungible: process.env.NEXT_PUBLIC_LOCAL_FUNGIBLE_CONTRACT_ID,
  };
}

// Use local contract ID if available, otherwise use production contract ID
const localContracts = getLocalContractIds();

// V1 Contract ID - dynamic based on selected network
function getV1ContractId(): string {
  // Local development takes priority
  if (localContracts?.simpleProxy) {
    return localContracts.simpleProxy;
  }
  
  // Check localStorage for selected network (client-side only)
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem("mira-selected-network");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.state?.selectedNetwork === "testnet") {
          // Testnet V1 contract (from Pavel)
          return "0xd5a716d967a9137222219657d7877bd8c79c64e1edb5de9f2901c98ebe74da80";
        }
      }
    } catch {
      // Ignore parse errors, use default
    }
  }
  // Default to mainnet V1 contract
  return "0x2e40f2b244b98ed6b8204b3de0156c6961f98525c8162f80162fcf53eebd90e7";
}

export const DEFAULT_AMM_CONTRACT_ID = getV1ContractId();

// V2 Contract ID (concentrated liquidity / binned liquidity)
// Dynamic based on selected network
function getV2ContractId(): string {
  // Check localStorage for selected network (client-side only)
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem("mira-selected-network");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.state?.selectedNetwork === "testnet") {
          // Testnet V2 contract (from Pavel)
          return "0x826908f28ebcab59bbe8c2cc9f0e9b2e12a244517cadce0aba6f534ecbbc2c2b";
        }
      }
    } catch {
      // Ignore parse errors, use default
    }
  }
  // Default to mainnet V2 contract (same as V1 for now since V2 not on mainnet yet)
  // TODO: Update with actual mainnet V2 contract when deployed
  return "0x2e40f2b244b98ed6b8204b3de0156c6961f98525c8162f80162fcf53eebd90e7";
}

export const DEFAULT_AMM_V2_CONTRACT_ID = getV2ContractId();

// Function to get asset ID from verified-assets.json based on symbol and environment
function getAssetIdFromVerifiedAssets(symbol: string): string {
  const asset = verifiedAssets.find((asset: any) => asset.symbol === symbol);
  if (!asset) {
    throw new Error(
      `Asset with symbol ${symbol} not found in verified-assets.json`
    );
  }

  // For local development, look for local_testnet chain
  if (process.env.NEXT_PUBLIC_FUEL_PROVIDER_URL?.includes("localhost")) {
    const localNetwork = asset.networks?.find(
      (network: any) =>
        network.type === "fuel" && network.chain === "local_testnet"
    );
    if (localNetwork?.assetId) {
      return localNetwork.assetId;
    }
    // Fallback to mainnet if local not found (shouldn't happen in proper setup)
    console.warn(
      `Local testnet asset ID not found for ${symbol}, falling back to mainnet`
    );
  }

  // For production, find the mainnet fuel network (chainId 9889)
  const mainnetNetwork = asset.networks?.find(
    (network: any) => network.type === "fuel" && network.chainId === 9889
  );
  if (mainnetNetwork?.assetId) {
    return mainnetNetwork.assetId;
  }

  // Final fallback: any fuel network
  const anyFuelNetwork = asset.networks?.find(
    (network: any) => network.type === "fuel"
  );
  if (anyFuelNetwork?.assetId) {
    return anyFuelNetwork.assetId;
  }

  throw new Error(`No fuel network found for asset ${symbol}`);
}

// Asset IDs - dynamically sourced from verified-assets.json
export const ETH_ASSET_ID = getAssetIdFromVerifiedAssets("ETH");
export const FUEL_ASSET_ID = getAssetIdFromVerifiedAssets("FUEL");
export const USDC_ASSET_ID = getAssetIdFromVerifiedAssets("USDC");

export const BASE_ASSET_CONTRACT =
  "0x7e2becd64cd598da59b4d1064b711661898656c6b1f4918a787156b8965dc83c";

export const DefaultTxParams: TxParams = {
  gasLimit: 2_000_000,
  maxFee: 275_000,
} as const;

// V2 concentrated liquidity operations require more gas due to multi-bin processing
export const DefaultV2TxParams: TxParams = {
  gasLimit: 50_000_000,
  maxFee: 1_000_000,
} as const;

// Create a deadline 1 hour (3600 seconds) in the future
// This is a function to ensure we always get a fresh timestamp
export const getMaxDeadline = () => Math.floor(Date.now() / 1000) + 3600;

// V2 contracts use TAI64 seconds; SDK validation supports TAI64 with a 3600s window.
// Return current time + 30 minutes in TAI64 to be safely within the window.
export const getMaxDeadlineV2 = () => {
  const nowSec = Math.floor(Date.now() / 1000);
  const TAI64_OFFSET = new BN(2).pow(new BN(62));
  return TAI64_OFFSET.add(new BN(nowSec + 1800));
};

export const DiscordLink = "https://discord.gg/9HzukDUKSq" as const;
export const XLink = "https://x.com/MicrochainDLM" as const;

export const BlogLink =
  "https://mirror.xyz/0xBE101110E07430Cf585123864a55f51e53ABc339" as const;

// Dynamic chain ID based on selected network
function getValidNetworkChainId(): number {
  // Local development uses chain ID 0
  if (process.env.NEXT_PUBLIC_FUEL_PROVIDER_URL?.includes("localhost")) {
    return 0;
  }

  // Check localStorage for selected network (client-side only)
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem("mira-selected-network");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.state?.selectedNetwork === "testnet") {
          // Fuel testnet chain ID - accept any chain ID when on testnet
          // since we can't know the exact testnet chain ID beforehand
          return -1; // Special value to indicate "any network is valid"
        }
      }
    } catch {
      // Ignore parse errors, use default
    }
  }

  // Default to mainnet
  return CHAIN_IDS.fuel.mainnet;
}

export const ValidNetworkChainId = getValidNetworkChainId();

// Dynamic network URL based on selected network
function getNetworkUrl(): string {
  if (process.env.NEXT_PUBLIC_FUEL_PROVIDER_URL) {
    return process.env.NEXT_PUBLIC_FUEL_PROVIDER_URL;
  }

  // Check localStorage for selected network (client-side only)
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem("mira-selected-network");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.state?.selectedNetwork === "testnet") {
          return "https://testnet.fuel.network/v1/graphql";
        }
      }
    } catch {
      // Ignore parse errors, use default
    }
  }

  return "https://mainnet.fuel.network/v1/graphql";
}

export const NetworkUrl: string = getNetworkUrl();

// Dynamic indexer URL based on selected network
// The network store persists to localStorage and reloads page on switch
function getSelectedIndexerUrl(): string {
  if (process.env.NEXT_PUBLIC_SUBSQUID_ENDPOINT) {
    return process.env.NEXT_PUBLIC_SUBSQUID_ENDPOINT;
  }

  // Check localStorage for selected network (client-side only)
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem("mira-selected-network");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.state?.selectedNetwork === "testnet") {
          return "https://mira-dex.squids.live/mira-testnet-indexer@test/api/graphql";
        }
      }
    } catch {
      // Ignore parse errors, use default
    }
  }

  // Default to mainnet
  return "https://mira-dex.squids.live/mira-indexer@v4/api/graphql";
}

export const SQDIndexerUrl = getSelectedIndexerUrl();
export const MainnetUrl = "https://mainnet-explorer.fuel.network";
export const ApiBaseUrl = "https://prod.api.microchain.systems" as const;

// Network-aware Fuel explorer URL for transaction links
function getSelectedFuelAppUrl(): string {
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem("mira-selected-network");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.state?.selectedNetwork === "testnet") {
          return "https://app-testnet.fuel.network";
        }
      }
    } catch {
      // Ignore parse errors
    }
  }
  return "https://app.fuel.network";
}

export const FuelAppUrl = getSelectedFuelAppUrl();

export const FuelAssetPriceUrl =
  " https://explorer-indexer-mainnet.fuel.network/assets" as const;

export const EthDecimals = 9 as const;
export const MinEthValue = 0.0001 as const;
export const MinEthValueBN = MinEthValue * 10 ** EthDecimals;

export const MAX_U256 = bn(
  "ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
  16
);

export const DefaultLocale = "en-US" as const;

export const CoinGeckoApiUrl = "https://pro-api.coingecko.com/api/v3" as const;

export const BASE_ASSETS = [ETH_ASSET_ID, USDC_ASSET_ID];

export function getDisclaimerMessage() {
  const brandText = getBrandText();
  return `Disclaimer
1. I am not a person or entity who resides in, is a citizen of, is incorporated in, or has a registered office in the United States of America or any other Prohibited Localities, as defined in the Terms of Use.

2. I will not access this site or use the ${brandText.dex} protocol while located within the United States or any Prohibited Localities.

3. I am not using, and will not use in the future, a VPN or other tools to obscure my physical location from a restricted territory.

4. I am lawfully permitted to access this site and use the ${brandText.dex} protocol under the laws of the jurisdiction in which I reside and am located.

5. I understand the risks associated with using decentralized protocols, including the ${brandText.dex} protocol, as outlined in the Terms of Use and Privacy Policy.`;
}

export const BoostsLearnMoreUrl =
  "https://mirror.xyz/miraly.eth/X-80QWbrq4f17L67Yy8QyQBdE5y2okxTzcfJIL-SHCQ" as const;

export const LIQUIDITY_PROVIDING_DOC_URL =
  "https://docs.microchain.systems/users/how-to-add-liquidity" as const;

export const BoostsRewardsTooltip =
  "These are the total Fuel tokens earned that will be distributed at the end of the season. The exact dollar amount will change based on Fuel’s current price. The exact token amount might change.";

export const boostsEpochTooltip =
  "The current season is 7 days long. All remaining rewards will be distributed at the end of the season.";

export const boosterBannerTitle =
  "Introducing Boost Rewards, earn $FUEL by providing liquidity.";

export const getPromoTitle = () => {
  const brandText = getBrandText();

  return `Introducing ${brandText.points}, earn points by providing liquidity and engaging in activities.`;
};

export const POINTS_PROMO_TITLE =
  "Introducing Microchain Points, earn points by providing liquidity and engaging in activities.";

export const EPOCH_NUMBER = 6 as const;

export const POINTS_TOOLTIP =
  "Your points are calculated based on the amount of liquidity you provide and the number of transactions you make.";

export const POINTS_RANK_TOOLTIP =
  "Your rank is determined by the amount of points you have accumulated.";

// TODO: Add the url for the points learn more
export const POINTS_LEARN_MORE_URL =
  "https://mirror.xyz/miraly.eth/W2W1Zv8jKS-70OY64cF-qneyPgLngG4ItRv9PMmxHeY";

export const POINTS_BANNER_TITLE = "Introducing Points";

export const POINTS_BANNER_SUBHEADER =
  "Earn MIRA points by providing liquidity and engaging in activities.";

export const SENTIO_POINTS_ENDPOINT =
  "https://endpoint.sentio.xyz/fuellabs/mira-mainnet/points-per-user-from-balance-table/async";

export const TickerTapeText =
  "🚀 BREAKING: MIRA IS NOW MICROCHAIN • COMING SOON: IMPROVED CAPITAL EFFICIENCY • ⛽ $FUEL COMMUNITY RALLIES IN ANTICIPATION";

export const fuelUsdcPoolKey =
  "0x1d5d97005e41cae2187a895fd8eab0506111e0e2f3331cd3912c15c24e3c1d82-0x286c479da40dc953bddc3bb4c453b608bba2e0ac483b077bd475174115395e6b-false";

export const DEFAULT_SLIPPAGE_BASIS_POINT = 50;
