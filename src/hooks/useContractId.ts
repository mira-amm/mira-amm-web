import {CHAIN_IDS} from "fuels";
import {useProvider} from "@fuels/react";

import {SMART_CONTRACT_MAP} from "../utils/constants";

const defaultValue = SMART_CONTRACT_MAP.get(CHAIN_IDS.fuel.mainnet) ?? "";

export default function useContractId(): string {
  const {provider} = useProvider();

  if (!provider) return defaultValue;

  return SMART_CONTRACT_MAP.get(provider.getChainId()) ?? defaultValue;
}
