import {ReactNode} from "react";
import {FuelProvider} from "@fuels/react";
import {Provider} from "fuels";
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
import {getBrandText} from "@/src/utils/brandName";
import {getCurrentNetworkConfig} from "@/src/stores/useNetworkStore";

// Creates a protection for SRR
const createFuelConfigForNetwork = () => {
  const networkConfig = getCurrentNetworkConfig();
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
          url: "https://www.microchain.systems",
          icons: ["https://connectors.fuel.network/logo_white.png"],
        },
      }),
    ],
  });

  const fuelProvider = new Provider(networkConfig.providerUrl);

  const externalConnectorConfig: Partial<{
    chainId: number;
    fuelProvider: Provider;
  }> = {chainId: networkConfig.chainId, fuelProvider};

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
};

const FUEL_CONFIG = createFuelConfig(createFuelConfigForNetwork);

export function FuelProviderWrapper({children}: {children: ReactNode}) {
  const networkConfig = getCurrentNetworkConfig();

  return (
    <FuelProvider
      networks={[
        {
          chainId: networkConfig.chainId,
          url: networkConfig.providerUrl,
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
