import {useMemo} from "react";
import {CHAIN_IDS} from "fuels";
import {useNetwork} from "@fuels/react";

import {SMART_CONTRACT_MAP} from "../../utils/constants";

const defaultValue = SMART_CONTRACT_MAP.get(CHAIN_IDS.fuel.mainnet) ?? "";

export default function useContractId(): string {
  const {network} = useNetwork();

  const contractId = useMemo(() => {
    if (!network) return defaultValue;

    return SMART_CONTRACT_MAP.get(network.chainId) ?? defaultValue;
  }, [network]);

  return contractId;
}
