import {useState, useEffect} from "react";
import {useWallet} from "@fuels/react";
import {ValidNetworkChainId} from "@/src/utils/constants";

export function useCheckActiveNetwork() {
  const {wallet} = useWallet();
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    const checkNetwork = async () => {
      // If ValidNetworkChainId is -1, it means we're on testnet and any chain is valid
      // This is because testnet chain IDs can vary
      if (ValidNetworkChainId === -1) {
        setIsValid(true);
        return;
      }

      const chainId = await wallet?.provider.getChainId();
      setIsValid(chainId === ValidNetworkChainId);
    };

    if (wallet) {
      checkNetwork();
    }
  }, [wallet]);

  return isValid;
}
