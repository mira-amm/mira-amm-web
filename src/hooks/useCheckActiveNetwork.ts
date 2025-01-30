import {useWallet} from "@fuels/react";
import {ValidNetworkChainIds} from "@/src/utils/constants";

const useCheckActiveNetwork = () => {
  const {wallet} = useWallet();

  if (wallet?.provider.getChainId() === undefined) return;

  return ValidNetworkChainIds.includes(wallet.provider.getChainId());
};

export default useCheckActiveNetwork;
