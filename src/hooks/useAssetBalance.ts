import {BN, CoinQuantity} from "fuels";
import {useMemo} from "react";

const useAssetBalance = (balances: CoinQuantity[] | undefined, assetId: string) => {
  return useMemo(() => balances?.find(b => b.assetId === assetId)?.amount ?? new BN(0), [balances, assetId]);
};

export default useAssetBalance;
