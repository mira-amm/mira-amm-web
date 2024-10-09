'use client';

import {ReactNode, useMemo} from "react";
import {FuelProvider} from "@fuels/react";
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";
import {
  BakoSafeConnector,
  BurnerWalletConnector,
  FueletWalletConnector,
  FuelWalletConnector,
  SolanaConnector,
  WalletConnectConnector
} from "@fuels/connectors";
import {createConfig, http, injected} from "@wagmi/core";
import {FuelConfig, FuelConnector} from "fuels";
import {CHAIN_IDS, Provider} from "fuels";
import {sepolia} from "@wagmi/core/chains";
import {walletConnect} from "@wagmi/connectors";
import {isMobile} from "react-device-detect";
import DisclaimerWrapper from "@/src/core/providers/DisclaimerWrapper";
import {NetworkUrl} from "@/src/utils/constants";

type Props = {
  children: ReactNode;
};

const WalletConnectProjectId = '35b967d8f17700b2de24f0abee77e579';
const queryClient = new QueryClient();
const wagmiConfig = createConfig({
  chains: [sepolia],
  transports: {
    [sepolia.id]: http(),
  },
  connectors: [
    injected({shimDisconnect: false}),
    walletConnect({
      projectId: WalletConnectProjectId,
      metadata: {
        name: "Mira DEX",
        description: "The Liquidity Hub on Fuel",
        url: "https://mira.ly/",
        icons: ["https://connectors.fuel.network/logo_white.png"],
      },
    }),
  ],
});

const NETWORKS = [
  // TODO: Make testnet/mainnet dependent on env variables?
  {
    chainId: CHAIN_IDS.fuel.mainnet,
    // The URL provided here will be the one used by the hooks to
    // query the RPC it will not use the one from the Wallet.
    url: NetworkUrl,
  },
];

const fuelProvider = Provider.create(NetworkUrl);

const connectorConfig = {
  chainId: CHAIN_IDS.fuel.mainnet,
  fuelProvider,
}

const Providers = ({children}: Props) => {
  // Use memo to avoid creating multiple instances of Connectors
  // What can generate memory leaks and cause flaky behaviors
  const fuelConfig = useMemo(() => {
    let connectors: FuelConnector[] = [];
    if (typeof window !== 'undefined') {
      connectors = isMobile ? [
        new FueletWalletConnector(),
        new BurnerWalletConnector({
          fuelProvider,
        }),
        new WalletConnectConnector({
          projectId: WalletConnectProjectId,
          wagmiConfig: wagmiConfig as any,
          fuelProvider,
        }),
        new SolanaConnector({
          projectId: WalletConnectProjectId,
          ...connectorConfig
        }),
      ] : [
        new FueletWalletConnector(),
        new BurnerWalletConnector({
          fuelProvider,
        }),
        new FuelWalletConnector(),
        new BakoSafeConnector(),
        new WalletConnectConnector({
          projectId: WalletConnectProjectId,
          wagmiConfig: wagmiConfig as any,
          fuelProvider,
        }),
        new SolanaConnector({
          projectId: WalletConnectProjectId,
          ...connectorConfig
        }),
      ];
    }
    const fuelConfig: FuelConfig = {
      connectors,
    };
    return fuelConfig;
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <FuelProvider
        networks={NETWORKS}
        fuelConfig={fuelConfig}
        uiConfig={{ suggestBridge: false }}
        theme="dark"
      >
        <DisclaimerWrapper>
          {children}
        </DisclaimerWrapper>
      </FuelProvider>
    </QueryClientProvider>
  );
};

export default Providers;
