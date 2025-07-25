import {ReactNode} from "react";
import {FuelProvider} from "@fuels/react";
import {CHAIN_IDS, Network, Provider} from "fuels";
import {isMobile} from "react-device-detect";
import {
  BakoSafeConnector,
  BurnerWalletConnector,
  createConfig as createFuelConfig,
  FueletWalletConnector,
  FuelWalletConnector,
  SolanaConnector,
  WalletConnectConnector,
} from "@fuels/connectors";
import {createConfig, http, injected} from "@wagmi/core";
import {mainnet} from "@wagmi/core/chains";
import {walletConnect} from "@wagmi/connectors";
import {NetworkUrl} from "@/src/utils/constants";
import {getBrandText} from "@/src/utils/brandName";

// Creates a protection for SRR
const FUEL_CONFIG = createFuelConfig(() => {
  const WalletConnectProjectId = "35b967d8f17700b2de24f0abee77e579";
  const brandText = getBrandText();

  const wagmiConfig = createConfig({
    syncConnectedChain: false,
    chains: [mainnet],
    transports: {
      [mainnet.id]: http(),
    },
    connectors: [
      injected({shimDisconnect: false}),
      walletConnect({
        projectId: WalletConnectProjectId,
        metadata: {
          name: brandText.dex,
          description: "The Liquidity Hub on Fuel",
          url: "https://mira.ly/",
          icons: ["https://connectors.fuel.network/logo_white.png"],
        },
      }),
    ],
  });

  const fuelProvider = new Provider(NetworkUrl);

  const externalConnectorConfig: Partial<{
    chainId: number;
    fuelProvider: Provider;
  }> = {chainId: CHAIN_IDS.fuel.mainnet, fuelProvider};

  const fueletWalletConnector = new FueletWalletConnector();
  const burnerWalletConnector = new BurnerWalletConnector({
    fuelProvider,
  });
  const fuelWalletConnector = new FuelWalletConnector();
  const bakoSafeConnector = new BakoSafeConnector();
  const walletConnectConnector = new WalletConnectConnector({
    projectId: WalletConnectProjectId,
    wagmiConfig: wagmiConfig as any,
    ...externalConnectorConfig,
  });
  const solanaConnector = new SolanaConnector({
    projectId: WalletConnectProjectId,
    ...externalConnectorConfig,
  });

  return {
    connectors: [
      fueletWalletConnector,
      // burnerWalletConnector,
      walletConnectConnector,
      solanaConnector,
      ...(isMobile ? [] : [fuelWalletConnector, bakoSafeConnector]),
    ],
  };
});

export function FuelProviderWrapper({children}: {children: ReactNode}) {
  return (
    <FuelProvider
      networks={[
        {
          chainId: CHAIN_IDS.fuel.mainnet,
          url: NetworkUrl,
        },
      ]}
      fuelConfig={FUEL_CONFIG}
      uiConfig={{suggestBridge: false}}
      theme="dark"
    >
      {children}
    </FuelProvider>
  );
}
