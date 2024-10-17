import useBalances from "@/src/hooks/useBalances/useBalances";
import {coinsConfig} from "@/src/utils/coinsConfig";
import {useMemo} from "react";
import {EthDecimals, MinEthValueBN} from "@/src/utils/constants";
import {CurrencyBoxState} from "@/src/components/common/Swap/Swap";
import {BN} from "fuels";

const useCheckEthBalance = (sellCoin?: CurrencyBoxState) => {
  const {balances} = useBalances();

  return useMemo(() => {
    const ethAssetId = coinsConfig.get('ETH')?.assetId!;
    const ethBalance = balances?.find(b => b.assetId === ethAssetId)?.amount ?? new BN(0);
    const ethForSell = sellCoin?.coin === 'ETH' && sellCoin.amount ? parseFloat(sellCoin.amount) : 0;

    // FIXME: This BN conversion leads to having ethForSellBN as 0, hence hook always returns true, ensure performing correct BN operations
    const ethForSellBN = new BN(ethForSell).mul(10 ** EthDecimals);
    const sufficientEthBalance = ethBalance.gte(ethForSellBN.add(MinEthValueBN));
    return Boolean(sufficientEthBalance);
  }, [balances, sellCoin?.coin, sellCoin?.amount]);
};

export default useCheckEthBalance;
