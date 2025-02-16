import {useMemo} from "react";
import {CHAIN_IDS} from "fuels";
import {useNetwork} from "@fuels/react";

import {EXPLORER_BASE_URL_MAP} from "../../utils/constants";

const defaultValue = EXPLORER_BASE_URL_MAP.get(CHAIN_IDS.fuel.mainnet) ?? "";

export default function useExplorerBaseUrl(): string {
  const {network} = useNetwork();

  const explorerBaseUrl = useMemo(() => {
    if (!network) return defaultValue;

    return EXPLORER_BASE_URL_MAP.get(network.chainId) ?? defaultValue;
  }, [network]);

  return explorerBaseUrl;
}
