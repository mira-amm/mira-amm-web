import {CHAIN_IDS} from "fuels";
import {useProvider} from "@fuels/react";

import {FUEL_APP_URL_MAP} from "../utils/constants";

const defaultValue = FUEL_APP_URL_MAP.get(CHAIN_IDS.fuel.mainnet) ?? "";

export default function useAppUrl(): string {
  const {provider} = useProvider();

  if (!provider) return defaultValue;

  return FUEL_APP_URL_MAP.get(provider.getChainId()) ?? defaultValue;
}
