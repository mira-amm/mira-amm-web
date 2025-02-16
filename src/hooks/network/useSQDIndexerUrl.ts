import {useMemo} from "react";
import {CHAIN_IDS} from "fuels";
import {useNetwork} from "@fuels/react";

import {SQD_INDEXER_URL_MAP} from "../../utils/constants";

const defaultValue = SQD_INDEXER_URL_MAP.get(CHAIN_IDS.fuel.mainnet) ?? "";

export default function useSQDIndexerUrl(): string {
  const {network} = useNetwork();

  const sqdIndexerUrl = useMemo(() => {
    if (!network) return defaultValue;

    return SQD_INDEXER_URL_MAP.get(network.chainId) ?? defaultValue;
  }, [network]);

  return sqdIndexerUrl;
}
