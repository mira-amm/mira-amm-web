import useBalances from "@/src/hooks/useBalances/useBalances";
import {coinsConfig} from "@/src/utils/coinsConfig";
import {useMemo} from "react";
import {MinEthValue} from "@/src/utils/constants";

const useCheckEthBalance = () => {
  const {balances} = useBalances();

  return useMemo(() => {
    const ethAssetId = coinsConfig.get('ETH')?.assetId!;
    const ethBalance = balances?.find(b => b.assetId === ethAssetId)?.amount.toNumber();
    const sufficientEthBalance = ethBalance && ethBalance >= MinEthValue;
    return Boolean(sufficientEthBalance);
  }, [balances]);
};

export default useCheckEthBalance;
