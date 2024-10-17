import useBalances from "@/src/hooks/useBalances/useBalances";
import {coinsConfig} from "@/src/utils/coinsConfig";
import {useMemo} from "react";
import {EthDecimals, MinEthValueBN} from "@/src/utils/constants";
import {CurrencyBoxState} from "@/src/components/common/Swap/Swap";
import {bn, BN} from "fuels";
import useAssetBalance from "@/src/hooks/useAssetBalance";

const useCheckEthBalance = (sellCoin?: CurrencyBoxState) => {
  const {balances} = useBalances();

  const ethBalance = useAssetBalance(balances, coinsConfig.get('ETH')?.assetId!);

  return useMemo(() => {
    const ethForSell = sellCoin?.coin === 'ETH' && sellCoin.amount
      ? bn.parseUnits(sellCoin.amount, EthDecimals)
      : new BN(0);
    const sufficientEthBalance = ethBalance.gte(ethForSell.add(MinEthValueBN));
    return Boolean(sufficientEthBalance);
  }, [ethBalance, sellCoin?.coin, sellCoin?.amount]);
};

export default useCheckEthBalance;
