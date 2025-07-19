"use client";

import {useQuery} from "@tanstack/react-query";
import {useAccount} from "@fuels/react";
import pointsRewards from "@/src/models/campaigns.json";
import {PointsResponse} from "@/src/models/points/interfaces";
import {getRewardsPoolsId} from "@/src/utils/common";
import {EPOCH_NUMBER} from "@/src/utils/constants";

export function usePoints(): {
  rewardsAmount: number;
  isLoading: boolean;
  error: string | undefined;
} {
  const {account} = useAccount();
  const epoch = pointsRewards.find((e) => e.number === EPOCH_NUMBER);
  const campaigns = epoch?.campaigns || [];
  const poolIds = getRewardsPoolsId(campaigns);

  const isEnabled =
    Boolean(account) && poolIds.length > 0 && campaigns.length > 0;

  const queryKey = ["rewards", account, EPOCH_NUMBER, poolIds.join(",")];

  const {data, isLoading, error} = useQuery({
    queryKey,
    enabled: isEnabled,
    queryFn: async () => {
      const params = new URLSearchParams({
        userId: account!,
        epochNumbers: String(EPOCH_NUMBER),
        poolIds: poolIds.join(","),
      });

      const res = await fetch(`/api/rewards?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch rewards");
      return res.json() as Promise<{rewardsAmount: number}>;
    },
  });

  return {
    rewardsAmount: campaigns.length > 0 ? data?.rewardsAmount || 0 : 0,
    isLoading,
    error: campaigns.length === 0 ? "No rewards data found" : error?.message,
  };
}

export function usePointsRanks(page: number, pageSize: number) {
  const offset = (page - 1) * pageSize;

  return useQuery({
    queryKey: ["points-ranks", page, pageSize],
    queryFn: async () => {
      const res = await fetch(`/api/points?limit=${pageSize}&offset=${offset}`);
      if (!res.ok) {
        throw new Error("Failed to fetch points ranks");
      }
      return res.json() as Promise<{
        data: PointsResponse[];
        totalCount: number;
      }>;
    },
  });
}

export function usePointsRank() {
  const {account} = useAccount();

  return useQuery({
    queryKey: ["points-rank", account],
    queryFn: async () => {
      const res = await fetch(`/api/points?address=${account}`);
      if (!res.ok) {
        throw new Error("Failed to fetch points rank");
      }
      return res.json() as Promise<{
        data: PointsResponse[];
        totalCount: number;
      }>;
    },
    enabled: Boolean(account),
    staleTime: 60 * 1000,
  });
}
