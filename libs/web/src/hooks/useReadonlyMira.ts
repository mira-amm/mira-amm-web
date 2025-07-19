import {useMemo} from "react";
import {ReadonlyMiraAmm} from "mira-dex-ts";
import {useProvider} from "@/src/hooks";
import {DEFAULT_AMM_CONTRACT_ID} from "@/src/utils/constants";

export function useReadonlyMira() {
  const provider = useProvider();

  return useMemo(() => {
    if (provider) {
      return new ReadonlyMiraAmm(provider, DEFAULT_AMM_CONTRACT_ID);
    }
  }, [provider]);
}
