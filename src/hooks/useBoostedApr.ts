import boostRewards from "@/src/models/campaigns.json";
import {useAssetPriceFromIndexer} from "./useAssetPriceFromIndexer";
import {getBoostReward} from "../utils/common";
import {FUEL_ASSET_ID} from "../utils/constants";

const useBoostedApr = (
  poolKey: string,
  tvlValue: number,
  epochNumber: number,
): {boostedApr: number; boostReward: number} => {
  const boostEpoch = boostRewards.find((epoch) => epoch.number === epochNumber);
  const rewardsData = boostEpoch?.campaigns;
  const {price: fuelToUsdRate} = useAssetPriceFromIndexer(FUEL_ASSET_ID);

  if (!rewardsData) {
    console.error("No epoch found matching the given epoch number");
    return {boostedApr: 0, boostReward: 0};
  }

  const boostReward = getBoostReward(poolKey, rewardsData);
  const usdPerYear = fuelToUsdRate * boostReward * 365;
  const boostedApr = (usdPerYear / tvlValue) * 100;
  const boostedAprRounded = Math.round(boostedApr * 100) / 100;
  return {boostedApr: boostedAprRounded, boostReward};
};

export default useBoostedApr;
