import mockRewards from "@/src/utils/pool-rewards.json";
import {useFuelPrice} from "./useFuelPrice";
import {getBoostReward} from "../utils/common";

const useBoostedApr = (
  poolKey: string,
  tvlValue: number,
): {boostedApr: number; boostReward: number} => {
  const rewardsData = mockRewards.data.pools;

  const {price: fuelToUsdRate} = useFuelPrice();
  const boostReward = getBoostReward(poolKey, rewardsData);
  const usdPerYear = fuelToUsdRate * boostReward * 365;
  const boostedApr = (usdPerYear / tvlValue) * 100;
  const boostedAprRounded = Math.round(boostedApr * 100) / 100;
  return {boostedApr: boostedAprRounded, boostReward};
};

export default useBoostedApr;
