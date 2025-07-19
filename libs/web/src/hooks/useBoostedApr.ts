import boostRewards from "@/src/models/campaigns.json";
import {useAssetPriceFromIndexer} from "@/src/hooks/useAssetPriceFromIndexer";
import {getBoostReward} from "../utils/common";
import {FUEL_ASSET_ID} from "../utils/constants";

export type RewardsToken = "$FUEL" | "Points" | undefined;

export function useBoostedApr(
  poolKey: string,
  tvlValue: number,
  epochNumber: number
): {
  boostedApr: number;
  boostReward: number;
  rewardsToken: RewardsToken;
} {
  const boostEpoch = boostRewards.find((epoch) => epoch.number === epochNumber);
  const rewardsData = boostEpoch?.campaigns;
  const {price: fuelToUsdRate} = useAssetPriceFromIndexer(FUEL_ASSET_ID);

  if (!rewardsData) {
    console.error("No epoch found matching the given epoch number");
    return {boostedApr: 0, boostReward: 0, rewardsToken: undefined};
  }

  const {dailyAmount, assetId} = getBoostReward(poolKey, rewardsData);

  if (assetId !== FUEL_ASSET_ID) {
    return {
      boostedApr: 0,
      boostReward: dailyAmount,
      rewardsToken: "Points",
    };
  }

  const usdPerYear = fuelToUsdRate * dailyAmount * 365;
  const boostedApr = (usdPerYear / tvlValue) * 100;
  const boostedAprRounded = Math.round(boostedApr * 100) / 100;
  return {
    boostedApr: boostedAprRounded,
    boostReward: dailyAmount,
    rewardsToken: "$FUEL",
  };
}
