import {CoinQuantity} from "fuels";
import {CoinName, coinsConfig} from "@/src/utils/coinsConfig";
import {getAssetNameByAssetId} from "@/src/utils/common";

const useAssetBalance = (balances: CoinQuantity[] | undefined, assetId: string) => {
  const assetName = getAssetNameByAssetId(assetId);
  const assetBalance = balances?.find(b => b.assetId === assetId)?.amount.toNumber();
  const assetBalanceValue = assetBalance ? assetBalance / 10 ** coinsConfig.get(assetName)?.decimals! : 0;
  return { assetBalance, assetBalanceValue };
};

export default useAssetBalance;
