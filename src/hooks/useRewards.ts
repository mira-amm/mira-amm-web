import {useQuery} from "@tanstack/react-query";
import axios from "axios";
import {RewardsApiUrl} from "../utils/constants";

interface RewardsResponse {
  rewardsAmount: number;
  userId: string;
  epochNumbers: number[];
  poolIds: string[];
}

interface UseRewardsParams {
  userId: string | null;
  epochNumber: number;
  poolIds: string;
}

interface UseRewardsReturn {
  rewardsAmount: number;
  isLoading: boolean;
}

export const useRewards = ({
  userId,
  epochNumber: epochNumber,
  poolIds,
}: UseRewardsParams): UseRewardsReturn => {
  const queryKey = ["rewards", userId, epochNumber, poolIds];

  const fetchRewards = async (): Promise<RewardsResponse> => {
    const response = await axios.get<RewardsResponse>(RewardsApiUrl, {
      params: {
        userId,
        epochNumber,
        poolIds,
      },
    });
    return response.data;
  };

  const {data, isLoading} = useQuery({
    queryKey,
    queryFn: fetchRewards,
    enabled: Boolean(userId) && poolIds.length > 0,
  });

  return {
    rewardsAmount: data?.rewardsAmount || 0,
    isLoading,
  };
};
