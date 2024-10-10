import {ReactNode, useMemo} from "react";
import {FuelProvider} from "@fuels/react";
import {CHAIN_IDS, FuelConfig, FuelConnector, Provider} from "fuels";
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
import {NetworkUrl} from "@/src/utils/constants";

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

type ConnectorConfig = Partial<{ chainId: number, fuelProvider: Promise<Provider> }>;
type Networks = Array<{ chainId: number, url: string }>;

const fuelProvider = Provider.create(NetworkUrl);

const connectorConfig: ConnectorConfig = {
  chainId: CHAIN_IDS.fuel.mainnet,
  fuelProvider,
};

const networks: Networks = [
    {
      chainId: CHAIN_IDS.fuel.mainnet,
      url: NetworkUrl,
    }
  ];

const FuelProviderWrapper = ({ children }: Props) => {
  // const fuelProvider = useProvider();

  // console.log('provider', fuelProvider);

  // const connectorConfig: ConnectorConfig = useMemo(() => {
  //   // if (!fuelProvider) {
  //   //   return {};
  //   // }
  //
  //   return {
  //     chainId: CHAIN_IDS.fuel.mainnet,
  //     fuelProvider,
  //   };
  // }, [fuelProvider]);

  // console.log('connector', connectorConfig);

  // const networks: Networks = useMemo(() => {
  //   // if (!fuelProvider) {
  //   //   return [];
  //   // }
  //
  //   return [
  //     {
  //       chainId: CHAIN_IDS.fuel.mainnet,
  //       url: NetworkUrl,
  //     }
  //   ];
  // }, [fuelProvider]);

  // console.log('networks', networks);

  const fuelConfig: FuelConfig = useMemo(() => {
    let connectors: FuelConnector[] = [];

    // if (!fuelProvider) {
    //   return {
    //     connectors,
    //   };
    // }

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
  }, []);

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
