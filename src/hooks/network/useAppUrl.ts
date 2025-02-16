import {useMemo} from "react";
import {CHAIN_IDS} from "fuels";
import {useNetwork} from "@fuels/react";

import {FUEL_APP_URL_MAP} from "../../utils/constants";

const defaultValue = FUEL_APP_URL_MAP.get(CHAIN_IDS.fuel.mainnet) ?? "";

export default function useAppUrl(): string {
  const {network} = useNetwork();

  const appUrl = useMemo(() => {
    if (!network) return defaultValue;

    return FUEL_APP_URL_MAP.get(network.chainId) ?? defaultValue;
  }, [network]);

  return appUrl;
}
