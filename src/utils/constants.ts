import {CHAIN_IDS, TxParams} from "fuels";

export const DEFAULT_AMM_CONTRACT_ID =
  "0x2e40f2b244b98ed6b8204b3de0156c6961f98525c8162f80162fcf53eebd90e7" as const;

export const ETH_ASSET_ID =
  "0xf8f8b6283d7fa5b672b530cbb84fcccb4ff8dc40f8176ef4544ddb1f1952ad07";
export const BASE_ASSET_CONTRACT =
  "0x7e2becd64cd598da59b4d1064b711661898656c6b1f4918a787156b8965dc83c";

export const USDC_ASSET_ID =
  "0x286c479da40dc953bddc3bb4c453b608bba2e0ac483b077bd475174115395e6b";

export const DefaultTxParams: TxParams = {
  gasLimit: 2_000_000,
  maxFee: 100_000,
} as const;

export const MaxDeadline = 4_294_967_295 as const;

export const DiscordLink = "https://discord.gg/6pHdTY6rYq" as const;
export const XLink = "https://x.com/MiraProtocol" as const;

export const BlogLink = "https://mirror.xyz/miraly.eth" as const;

// TODO: Use env variables for values below to separate dev/prod | testnet/mainnet
export const ValidNetworkChainId = CHAIN_IDS.fuel.mainnet;
export const NetworkUrl: string = "https://mainnet.fuel.network/v1/graphql";
export const IndexerUrl =
  "https://indexer.bigdevenergy.link/755fa3e/v1/graphql" as const;
export const SQDIndexerUrl =
  "https://mira-dex.squids.live/mira-indexer@v2/api/graphql" as const;
export const ApiBaseUrl = "https://prod.api.mira.ly" as const;

export const FuelAppUrl = "https://app.fuel.network" as const;

export const EthDecimals = 9 as const;
export const MinEthValue = 0.0001 as const;
export const MinEthValueBN = MinEthValue * 10 ** EthDecimals;

export const DefaultLocale = "en-US" as const;

export const CoinGeckoApiUrl = "https://pro-api.coingecko.com/api/v3" as const;

export const DisclaimerMessage = `Disclaimer
1. I am not a person or entity who resides in, is a citizen of, is incorporated in, or has a registered office in the United States of America or any other Prohibited Localities, as defined in the Terms of Use.

2. I will not access this site or use the Mira Dex protocol while located within the United States or any Prohibited Localities.

3. I am not using, and will not use in the future, a VPN or other tools to obscure my physical location from a restricted territory.

4. I am lawfully permitted to access this site and use the Mira Dex protocol under the laws of the jurisdiction in which I reside and am located.

5. I understand the risks associated with using decentralized protocols, including the Mira Dex protocol, as outlined in the Terms of Use and Privacy Policy.`;

export const BoostsLearnMoreUrl =
  "https://app.fuel.network/earn-points" as const;

export const BoostsRewardsTooltip =
  "These are the total Fuel tokens earned that will be distributed at the end of the epoch. The exact dollar amount will change based on Fuel’s current price. ";

export const boostsEpochTooltip =
  "Current epoch lasts for 45 days total. All rewards wll be distributed at the end of the epoch. ";

//Start and end date for booster rewards program
export const startDate = "2025-01-15T00:00:00"; // January 15, 2025
export const endDate = "2025-03-01T23:59:59"; // March 1, 2025

//pairs with booster rewards
export const pairsWithRewards = ["USDC/ETH", "FUEL/ETH", "USDC/USDT"];

export const fuelAmount = 25000;
export const RewardsApiUrl = "/api/rewards" as const;

export const RewardsPoolsId =
  "286c479da40dc953bddc3bb4c453b608bba2e0ac483b077bd475174115395e6b-f8f8b6283d7fa5b672b530cbb84fcccb4ff8dc40f8176ef4544ddb1f1952ad07-false,286c479da40dc953bddc3bb4c453b608bba2e0ac483b077bd475174115395e6b-a0265fb5c32f6e8db3197af3c7eb05c48ae373605b8165b6f4a51c5b0ba4812e-false,1d5d97005e41cae2187a895fd8eab0506111e0e2f3331cd3912c15c24e3c1d82-f8f8b6283d7fa5b672b530cbb84fcccb4ff8dc40f8176ef4544ddb1f1952ad07-false";
