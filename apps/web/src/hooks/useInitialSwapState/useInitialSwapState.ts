import {SwapState} from "@/src/components/common/Swap/Swap";
import {useMemo} from "react";
import {useLocalStorage} from "usehooks-ts";
import {ETH_ASSET_ID, USDC_ASSET_ID} from "@/src/utils/constants";

const b256Regex = /0x[0-9a-fA-F]{64}/;

const useInitialSwapState = () => {
  // TODO: Resolve hydration issue without losing the ability to set initial state
  const [swapCoins] = useLocalStorage<{
    buy: string | null;
    sell: string | null;
  }>("swapCoins", {sell: null, buy: null});

  return useMemo(() => {
    const sellCoinIsValid =
      swapCoins.sell !== null && b256Regex.test(swapCoins.sell);
    const buyCoinIsValid =
      swapCoins.buy !== null && b256Regex.test(swapCoins.buy);
    const sellAsset = sellCoinIsValid ? swapCoins.sell : ETH_ASSET_ID;
    const buyAsset = buyCoinIsValid ? swapCoins.buy : USDC_ASSET_ID;

    const initialSwapState: SwapState = {
      sell: {
        assetId: sellAsset,
        amount: "",
      },
      buy: {
        assetId: buyAsset,
        amount: "",
      },
    };

    return initialSwapState;
  }, [swapCoins.buy, swapCoins.sell]);
};

export default useInitialSwapState;
