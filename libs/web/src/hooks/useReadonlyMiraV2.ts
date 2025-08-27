import {useMemo} from "react";
import {ReadonlyMiraAmmV2} from "mira-dex-ts";
import {useProvider} from "@/src/hooks";
import {DEFAULT_AMM_CONTRACT_ID} from "@/src/utils/constants";

export function useReadonlyMiraV2() {
  const provider = useProvider();

  return useMemo(() => {
    if (provider) {
      return new ReadonlyMiraAmmV2(provider, DEFAULT_AMM_CONTRACT_ID);
    }
  }, [provider]);
}
