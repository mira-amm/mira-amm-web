import {useMutation} from "@tanstack/react-query";
import {useCallback} from "react";

import useFaucetSDK from "@/src/hooks/useFaucetSDK/useFaucetSDK";

const useClaimFaucet = () => {
  const faucetSDK = useFaucetSDK();

  const mutationFn = useCallback(async () => {
    if (!faucetSDK) {
      return;
    }

    return;
  }, [faucetSDK]);

  const { data, mutateAsync, isPending } = useMutation({
    mutationFn,
  });

  return { data, mutateAsync, isPending };
};

export default useClaimFaucet;
