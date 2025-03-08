import {useAccount} from "@fuels/react";
import pointsRewards from "@/src/models/campaigns.json";
import {EPOCH_NUMBER} from "@/src/utils/constants";
import {useMemo} from "react";
import {getRewardsPoolsId} from "@/src/utils/common";
import {useRewards} from "../useRewards";
import {useQuery} from "@tanstack/react-query";
import {PointsResponse} from "@/src/models/points/interfaces";

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

export const usePointsRanks = (page: number, pageSize: number) => {
  const offset = (page - 1) * pageSize;

  return useQuery({
    queryKey: ["points-ranks", page, pageSize],
    queryFn: async () => {
      const response = await fetch(
        `/api/points?limit=${pageSize}&offset=${offset}`,
      );
      if (!response.ok) {
        throw new Error("Failed to fetch points ranks");
      }
      return response.json() as Promise<{
        data: PointsResponse[];
        totalCount: number;
      }>;
    },
  });
};

export const usePointsRank = () => {
  const {account} = useAccount();

  return useQuery({
    queryKey: ["points-rank", account],
    queryFn: async () => {
      const response = await fetch(`/api/points?address=${account}`);
      return response.json() as Promise<{
        data: PointsResponse[];
        totalCount: number;
      }>;
    },
  });
};
