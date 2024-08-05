'use client';

import {ReactNode} from "react";
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
import PersistentConnectorProvider from "@/src/core/providers/PersistentConnector";
import {sepolia} from "@wagmi/core/chains";
import {walletConnect} from "@wagmi/connectors";

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
        url: location.href,
        icons: ["https://connectors.fuel.network/logo_white.png"],
      },
    }),
  ],
});

const Providers = ({children}: Props) => {
  let connectors: FuelConnector[] = [];
  if (typeof window !== 'undefined') {
    connectors = [
      new FueletWalletConnector(),
      new BurnerWalletConnector(),
      new FuelWalletConnector(),
      new BakoSafeConnector(),
      new WalletConnectConnector({
        projectId: WalletConnectProjectId,
        wagmiConfig: wagmiConfig as any
      }),
      new SolanaConnector({projectId: WalletConnectProjectId})
    ];
  }

  const fuelConfig: FuelConfig = {
    connectors,
  };

  return (
    <QueryClientProvider client={queryClient}>
      <FuelProvider
        fuelConfig={fuelConfig}
        theme="dark"
      >
        <PersistentConnectorProvider>
          {children}
        </PersistentConnectorProvider>
      </FuelProvider>
    </QueryClientProvider>
  );
};

export default Providers;
