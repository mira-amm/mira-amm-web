import {useMemo} from "react";
import {ReadonlyMiraAmm} from "mira-dex-ts";
import useProvider from "@/src/hooks/useProvider/useProvider";
import useContractId from "./useContractId";

const useReadonlyMira = () => {
  const provider = useProvider();
  const contractId = useContractId();

  return useMemo(() => {
    if (provider && contractId) {
      return new ReadonlyMiraAmm(provider, contractId);
    }
  }, [provider, contractId]);
};

export default useReadonlyMira;
