import boostRewards from "@/src/models/campaigns.json";
import {useAssetPriceFromIndexer} from "./useAssetPriceFromIndexer";
import {getBoostReward} from "../utils/common";
import {fuelAssetId} from "../utils/constants";

const useBoostedApr = (
  poolKey: string,
  tvlValue: number,
): {boostedApr: number; boostReward: number} => {
  const rewardsData = boostRewards[0].campaigns;

  const {price: fuelToUsdRate} = useAssetPriceFromIndexer(fuelAssetId);
  const boostReward = getBoostReward(poolKey, rewardsData);
  const usdPerYear = fuelToUsdRate * boostReward * 365;
  const boostedApr = (usdPerYear / tvlValue) * 100;
  const boostedAprRounded = Math.round(boostedApr * 100) / 100;
  return {boostedApr: boostedAprRounded, boostReward};
};

export default useBoostedApr;
