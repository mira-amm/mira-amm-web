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

type ExternalConnectorConfig = Partial<{
  chainId: number;
  fuelProvider: Promise<Provider>;
}>;
type Props = {
  children: ReactNode;
};
const networks: Array<Network> = [
  {
    chainId: CHAIN_IDS.fuel.mainnet,
    url: NetworkUrl,
  },
];

// Creates a protection for SRR
const FUEL_CONFIG = createFuelConfig(() => {
  const WalletConnectProjectId = "35b967d8f17700b2de24f0abee77e579";
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
          name: "Mira DEX",
          description: "The Liquidity Hub on Fuel",
          url: "https://mira.ly/",
          icons: ["https://connectors.fuel.network/logo_white.png"],
        },
      }),
    ],
  });

  const fuelProvider = Provider.create(NetworkUrl);

  const externalConnectorConfig: ExternalConnectorConfig = {
    chainId: CHAIN_IDS.fuel.mainnet,
    fuelProvider,
  };

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

const FuelProviderWrapper = ({children}: Props) => {
  return (
    <FuelProvider
      networks={networks}
      fuelConfig={FUEL_CONFIG}
      uiConfig={{suggestBridge: false}}
      theme="dark"
    >
      {children}
    </FuelProvider>
  );
};

export default FuelProviderWrapper;
