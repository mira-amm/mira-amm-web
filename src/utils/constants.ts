import {CHAIN_IDS, TxParams} from "fuels";

export const DEFAULT_AMM_CONTRACT_ID =
  "0x197251b052ff32fb8cd0951b880e135c036d1c8e170da569d536c0717be6f3a1" as const;

export const DefaultTxParams: TxParams = {
  gasLimit: 10_000_000,
  maxFee: 1_000_000,
} as const;

export const MaxDeadline = 4_294_967_295 as const;

export const DiscordLink = 'https://discord.gg/6pHdTY6rYq' as const;
export const XLink = 'https://x.com/MiraProtocol' as const;

export const BlogLink = "https://mirror.xyz/miraly.eth" as const;

// TODO: Use env variables for values below to separate dev/prod | testnet/mainnet
export const ValidNetworkChainId = CHAIN_IDS.fuel.mainnet;
export const NetworkUrl: string = 'https://mainnet.fuel.network/v1/graphql';
export const IndexerUrl = 'https://indexer.bigdevenergy.link/755fa3e/v1/graphql' as const;
export const ApiBaseUrl = 'https://prod.api.mira.ly' as const;

export const FuelAppUrl = 'https://app.fuel.network' as const;

export const EthDecimals = 9 as const;
export const MinEthValue = 0.001 as const;
export const MinEthValueBN = MinEthValue * 10 ** EthDecimals;

export const DefaultLocale = 'en-US' as const;

export const CoinGeckoApiUrl = 'https://pro-api.coingecko.com/api/v3' as const;

export const DisclaimerMessage = `Disclaimer
1. I am not a person or entity who resides in, is a citizen of, is incorporated in, or has a registered office in the United States of America or any other Prohibited Localities, as defined in the Terms of Use.

2. I will not access this site or use the Mira Dex protocol while located within the United States or any Prohibited Localities.

3. I am not using, and will not use in the future, a VPN or other tools to obscure my physical location from a restricted territory.

4. I am lawfully permitted to access this site and use the Mira Dex protocol under the laws of the jurisdiction in which I reside and am located.

5. I understand the risks associated with using decentralized protocols, including the Mira Dex protocol, as outlined in the Terms of Use and Privacy Policy.`;
