import {CoinName, coinsConfig} from "@/src/utils/coinsConfig";
import {SwapState} from "@/src/components/common/Swap/Swap";
import {useMemo} from "react";
import {useLocalStorage} from "usehooks-ts";

const useInitialSwapState = () => {
  const [swapCoins, setSwapCoins] = useLocalStorage('swapCoins', {sell: null, buy: null});

  return useMemo(() => {
    const sellCoinExistsInMap = swapCoins.sell !== null && coinsConfig.has(swapCoins.sell as CoinName);
    const buyCoinExistsInMap = swapCoins.buy !== null && coinsConfig.has(swapCoins.buy as CoinName);
    const sellCoin = sellCoinExistsInMap ? swapCoins.sell as CoinName : 'ETH';
    const buyCoin = buyCoinExistsInMap ? swapCoins.buy as CoinName : 'USDT';

    const initialSwapState: SwapState = {
      sell: {
        coin: sellCoin,
        amount: '',
      },
      buy: {
        coin: buyCoin,
        amount: '',
      },
    };

    return initialSwapState;
  },[swapCoins.buy, swapCoins.sell])
};

export default useInitialSwapState;
