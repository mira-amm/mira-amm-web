import useBalances from "@/src/hooks/useBalances/useBalances";
import {coinsConfig} from "@/src/utils/coinsConfig";
import {useMemo} from "react";
import {MinEthValueBN} from "@/src/utils/constants";
import {CurrencyBoxState} from "@/src/components/common/Swap/Swap";

const useCheckEthBalance = (sellCoin?: CurrencyBoxState) => {
  const {balances} = useBalances();

  return useMemo(() => {
    const ethAssetId = coinsConfig.get('ETH')?.assetId!;
    const ethDecimals = coinsConfig.get('ETH')?.decimals!;
    const ethBalance = balances?.find(b => b.assetId === ethAssetId)?.amount.toNumber() ?? 0;
    const ethForSell = sellCoin?.coin === 'ETH' && sellCoin.amount ? parseFloat(sellCoin.amount) : 0;
    const sufficientEthBalance = ethBalance >= ethForSell * 10**ethDecimals + MinEthValueBN;
    return Boolean(sufficientEthBalance);
  }, [balances, sellCoin?.coin, sellCoin?.amount]);
};

export default useCheckEthBalance;
