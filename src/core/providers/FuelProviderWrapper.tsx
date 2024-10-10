import {ReactNode, useMemo} from "react";
import {FuelProvider} from "@fuels/react";
import {FuelConfig, FuelConnector, Provider} from "fuels";
import {isMobile} from "react-device-detect";
import {
  BakoSafeConnector,
  BurnerWalletConnector,
  FueletWalletConnector,
  FuelWalletConnector, SolanaConnector,
  WalletConnectConnector
} from "@fuels/connectors";
import {createConfig, http, injected} from "@wagmi/core";
import {sepolia} from "@wagmi/core/chains";
import {walletConnect} from "@wagmi/connectors";
import useProvider from "@/src/hooks/useProvider/useProvider";

type Props = {
  children: ReactNode;
};

const WalletConnectProjectId = '35b967d8f17700b2de24f0abee77e579';
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

type ConnectorConfig = Partial<{ chainId: number, fuelProvider: Provider }>;
type Networks = Array<{ chainId: number, url: string }>;

const FuelProviderWrapper = ({ children }: Props) => {
  const fuelProvider = useProvider();

  const connectorConfig: ConnectorConfig = useMemo(() => {
    if (!fuelProvider) {
      return {};
    }

    return {
      chainId: fuelProvider.getChainId(),
      fuelProvider,
    };
  }, [fuelProvider]);

  const networks: Networks = useMemo(() => {
    if (!fuelProvider) {
      return [];
    }

    return [
      {
      chainId: fuelProvider?.getChainId(),
      url: fuelProvider?.url,
      }
    ];
  }, [fuelProvider]);

  const fuelConfig: FuelConfig = useMemo(() => {
    let connectors: FuelConnector[] = [];

    if (!fuelProvider) {
      return {
        connectors,
      };
    }

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

    return { connectors };
  }, [fuelProvider, connectorConfig]);

  return (
    <FuelProvider
      networks={networks}
      fuelConfig={fuelConfig}
      uiConfig={{ suggestBridge: false }}
      theme="dark"
    >
      {children}
    </FuelProvider>
  );
};

export default FuelProviderWrapper;
