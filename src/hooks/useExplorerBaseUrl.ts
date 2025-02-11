import {CHAIN_IDS} from "fuels";
import {useProvider} from "@fuels/react";

import {EXPLORER_BASE_URL_MAP} from "../utils/constants";

const defaultValue = EXPLORER_BASE_URL_MAP.get(CHAIN_IDS.fuel.mainnet) ?? "";

export default function useExplorerBaseUrl(): string {
  const {provider} = useProvider();

  if (!provider) return defaultValue;

  return EXPLORER_BASE_URL_MAP.get(provider.getChainId()) ?? defaultValue;
}
