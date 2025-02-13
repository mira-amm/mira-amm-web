import {useMemo} from "react";
import {CHAIN_IDS} from "fuels";
import {useProvider} from "@fuels/react";

import {SQD_INDEXER_URL_MAP} from "../../utils/constants";

const defaultValue = SQD_INDEXER_URL_MAP.get(CHAIN_IDS.fuel.mainnet) ?? "";

export default function useSQDIndexerUrl(): string {
  const {provider} = useProvider();

  const sqdIndexerUrl = useMemo(() => {
    if (!provider) return defaultValue;

    return SQD_INDEXER_URL_MAP.get(provider.getChainId()) ?? defaultValue;
  }, [provider]);

  return sqdIndexerUrl;
}
