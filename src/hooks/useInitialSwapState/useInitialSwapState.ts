import {CoinName, coinsConfig} from "@/src/utils/coinsConfig";
import {useSearchParams} from "next/navigation";
import {SwapState} from "@/src/components/common/Swap/Swap";
import {useMemo} from "react";

const useInitialSwapState = () => {
  const searchParams = useSearchParams();

  return useMemo(() => {
    const sellSearchParam = searchParams.get('sell');
    const sellSearchParamExistsInMap =  sellSearchParam !== null && coinsConfig.has(sellSearchParam as CoinName);
    const buySearchParam = searchParams.get('buy');
    const buySearchParamExistsInMap =  buySearchParam !== null && coinsConfig.has(buySearchParam as CoinName);

    const sell = sellSearchParamExistsInMap ? sellSearchParam as CoinName : 'MIMIC';
    const buy = buySearchParamExistsInMap ? buySearchParam as CoinName : null;

    // TODO: Rewrite search parameters
    if (sell === buy) {
      return {
        sell: {
          coin: sell,
          amount: '',
        },
        buy: {
          coin: null,
          amount: '',
        },
      };
    }

    const initialSwapState: SwapState = {
      sell: {
        coin: sell,
        amount: '',
      },
      buy: {
        coin: buy,
        amount: '',
      },
    };

    return initialSwapState;
  },[searchParams])
};

export default useInitialSwapState;
