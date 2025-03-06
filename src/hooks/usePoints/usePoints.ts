import {useAccount} from "@fuels/react";
import pointsRewards from "@/src/models/campaigns.json";
import {EPOCH_NUMBER} from "@/src/utils/constants";
import {useMemo} from "react";
import {getRewardsPoolsId} from "@/src/utils/common";
import {useRewards} from "../useRewards";

export const usePoints = (): {
  rewardsAmount: number;
  isLoading: boolean;
  error: string | undefined;
} => {
  const {account} = useAccount();

  // look up the rewards data for the current epoch
  const epoch = useMemo(
    () => pointsRewards.find((epoch) => epoch.number === EPOCH_NUMBER),
    [],
  );

  const rewardsData = epoch?.campaigns || [];
  const rewardsPoolsId = getRewardsPoolsId(rewardsData);

  const {rewardsAmount, isLoading: isRewardsAmountLoading} = useRewards({
    userId: account,
    epochNumbers: EPOCH_NUMBER,
    poolIds: rewardsPoolsId,
  });

  // Determine error after all hooks have been called
  const error = !epoch?.campaigns ? "No rewards data found" : undefined;

  return {
    rewardsAmount: !epoch?.campaigns ? 0 : rewardsAmount,
    isLoading: isRewardsAmountLoading,
    error,
  };
};

export const usePointsRank = () => {
  const {account} = useAccount();

  return {
    // TODO: add the function to get the rank
    rank: 1,
    isLoading: false,
    error: undefined,
  };
};
