import {CoinQuantity} from "fuels";
import {CoinName, coinsConfig} from "@/src/utils/coinsConfig";

const useCoinBalance = (balances: CoinQuantity[] | undefined, coin: CoinName) => {
  const coinBalance = balances?.find(b => b.assetId === coinsConfig.get(coin)?.assetId)?.amount.toNumber();
  const coinBalanceValue = coinBalance ? coinBalance / 10 ** coinsConfig.get(coin)?.decimals! : 0;
  return { coinBalance, coinBalanceValue };
};

export default useCoinBalance;
