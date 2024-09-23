import type { TxParams } from "fuels";

export const DEFAULT_AMM_CONTRACT_ID =
  "0xd5a716d967a9137222219657d7877bd8c79c64e1edb5de9f2901c98ebe74da80" as const;
export const FaucetContractAddress = '0xa1ada1dcab2524dc7f030bbff36c14ede24efd8becffac022a4c501e977e13c6' as const;

export const DefaultTxParams: TxParams = {
  gasLimit: 10_000_000,
  maxFee: 1_000_000,
} as const;

export const MaxDeadline = 4_294_967_295 as const;

export const DiscordLink = 'https://discord.gg/6pHdTY6rYq' as const;
export const XLink = 'https://x.com/MiraProtocol' as const;
export const BlogLink = "https://mirror.xyz/miraly.eth" as const;

export const ValidNetwork = 'testnet' as const;
export const TestnetUrl = 'https://testnet.fuel.network/v1/graphql' as const;

export const IndexerUrl = 'https://indexer.bigdevenergy.link/4201e23/v1/graphql' as const;

// TODO: Use env variables for dev/prod
export const ApiBaseUrl = 'https://prod.api.mira.ly' as const;

export const MinEthValue = 0.001 as const;
export const MinEthValueBN = MinEthValue * 10 ** 9;

export const DefaultLocale = 'en-US' as const;
