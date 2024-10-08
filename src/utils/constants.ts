import type { TxParams } from "fuels";

export const DEFAULT_AMM_CONTRACT_ID =
  "0xe68f7269cc74edfafd10de380288b89e8d419f3b456f78ba727a8cb0d679b163" as const;
export const FaucetContractAddress = '0xa1ada1dcab2524dc7f030bbff36c14ede24efd8becffac022a4c501e977e13c6' as const;

export const DefaultTxParams: TxParams = {
  gasLimit: 10_000_000,
  maxFee: 1_000_000,
} as const;

export const MaxDeadline = 4_294_967_295 as const;

export const DiscordLink = 'https://discord.gg/6pHdTY6rYq' as const;
export const XLink = 'https://x.com/MiraProtocol' as const;

export const BlogLink = "https://mirror.xyz/miraly.eth" as const;

// TODO: Use env variables for values below to separate dev/prod | testnet/mainnet
export const ValidNetworkChainId = 9889 as const;
export const NetworkUrl: string = process.env.PRIVATE_MAINNET_URL!;
export const IndexerUrl = 'https://indexer.bigdevenergy.link/99318f9/v1/graphql' as const;
export const ApiBaseUrl = 'https://prod.api.mira.ly' as const;

export const MinEthValue = 0.001 as const;
export const MinEthValueBN = MinEthValue * 10 ** 9;

export const DefaultLocale = 'en-US' as const;

export const AssetRatesApiUrl = 'https://nhnv2j1cac.execute-api.us-east-1.amazonaws.com/crypto-api/market-data/exchange-rates/by-symbols' as const;
