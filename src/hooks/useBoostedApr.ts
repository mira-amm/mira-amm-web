import {useState, useEffect} from "react";
import mockRewards from "@/src/utils/pool-rewards.json";
import {useFuelPrice} from "./useFuelPrice";
import {startDate, endDate} from "../utils/constants";
import {fuelAmount} from "../utils/constants";
interface RewardPool {
  id: string;
  boosterValue: number;
}

import {
  calculateDateDifference,
  getBoostReward,
  calculateUsdValue,
} from "../utils/common";

const useBoostedApr = (
  poolKey: string,
  tvlValue: number,
): {boostedApr: number; loading: boolean; boostReward: number | undefined} => {
  const [boostedApr, setBoostedApr] = useState<number>(0);
  const [boostReward, setBoostReward] = useState<number | undefined>(0);
  const [loading, setLoading] = useState<boolean>(true);

  const getRewardsData = (): RewardPool[] => {
    return mockRewards.data.pools;
  };

  const rewardsData = getRewardsData();

  const {price} = useFuelPrice();
  const fuelToUsdRate = price ? parseFloat(price) : 0;

  const usdValue = calculateUsdValue(fuelAmount, fuelToUsdRate);

  useEffect(() => {
    const calculateApr = () => {
      setLoading(true);

      // Calculate the program length (difference between start and end dates)
      const programLength = calculateDateDifference(startDate, endDate);

      const boostReward = poolKey ? getBoostReward(poolKey, rewardsData) : 0;
      setBoostReward(boostReward);

      const fuelPrice = parseFloat(usdValue.replace(/[^0-9.-]+/g, ""));

      const fuelPricePerUnit = fuelPrice / fuelAmount;

      // Calculate APR per program length
      const aprPerProgramLength = boostReward
        ? (fuelPricePerUnit * boostReward) / (programLength * 365)
        : 0;

      // Calculate the actual APR (APR divided by TVL)
      const aprActualCalculated =
        tvlValue > 0 ? aprPerProgramLength / tvlValue : 0;

      setBoostedApr(parseFloat(aprActualCalculated.toFixed(2)));
      setLoading(false);
    };

    calculateApr();
  }, [poolKey, usdValue, tvlValue, rewardsData]);

  return {boostedApr, loading, boostReward};
};

export default useBoostedApr;
