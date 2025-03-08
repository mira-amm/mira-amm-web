import boostRewards from "@/src/models/campaigns.json";
import {useFuelPrice} from "./useFuelPrice";
import {getBoostReward} from "../utils/common";
import {FUEL_ASSET_ID} from "../utils/constants";

export type RewardsToken = "$FUEL" | "Points" | undefined;

const useBoostedApr = (
  poolKey: string,
  tvlValue: number,
  epochNumber: number,
): {
  boostedApr: number;
  boostReward: number;
  rewardsToken: RewardsToken;
} => {
  const boostEpoch = boostRewards.find((epoch) => epoch.number === epochNumber);
  const rewardsData = boostEpoch?.campaigns;
  const {price: fuelToUsdRate} = useFuelPrice();

  if (!rewardsData) {
    console.error("No epoch found matching the given epoch number");
    return {boostedApr: 0, boostReward: 0, rewardsToken: undefined};
  }

  const boostReward = getBoostReward(poolKey, rewardsData);

  const rewardsInfo = rewardsData?.[0]?.rewards[0];

  if (rewardsInfo?.assetId !== FUEL_ASSET_ID) {
    return {
      boostedApr: 0,
      boostReward: rewardsInfo?.dailyAmount,
      rewardsToken: "Points",
    };
  }

  const usdPerYear = fuelToUsdRate * boostReward * 365;
  const boostedApr = (usdPerYear / tvlValue) * 100;
  const boostedAprRounded = Math.round(boostedApr * 100) / 100;
  return {boostedApr: boostedAprRounded, boostReward, rewardsToken: "$FUEL"};
};

export default useBoostedApr;
