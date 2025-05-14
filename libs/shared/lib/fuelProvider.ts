import {NETWORK_URL} from "./constants";
import {
  BakoSafeConnector,
  createConfig as createFuelConfig,
  FueletWalletConnector,
  FuelWalletConnector,
} from "@fuels/connectors";
import {CHAIN_IDS, Network} from "fuels";

export const networks: Array<Network> = [
  {
    chainId: CHAIN_IDS.fuel.mainnet,
    url: NETWORK_URL,
  },
];

export const FUEL_CONFIG = createFuelConfig(() => {
  const fueletWalletConnector = new FueletWalletConnector();
  const fuelWalletConnector = new FuelWalletConnector();
  const bakoSafeConnector = new BakoSafeConnector();

  return {
    connectors: [fueletWalletConnector, fuelWalletConnector, bakoSafeConnector],
  };
});
