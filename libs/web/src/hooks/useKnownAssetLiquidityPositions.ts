"use client";

import {useMemo} from "react";
import {BN} from "fuels";
import {useQuery} from "@tanstack/react-query";
import {buildPoolId, getLPAssetId, PoolId, type Asset} from "mira-dex-ts";

import {useBalances} from "@/src/hooks/useBalances";
import {useReadonlyMira} from "@/src/hooks/useReadonlyMira";
import {coinsConfig, type CoinData} from "@/src/utils/coinsConfig";
import {DEFAULT_AMM_CONTRACT_ID} from "@/src/utils/constants";

export type KnownAssetLiquidityPosition = {
  poolId: PoolId;
  lpAssetId: string;
  lpTokenBalance: BN;
  isStable: boolean;
  assetA: CoinData;
  assetB: CoinData;
  underlyingAssets: [Asset, Asset];
};

type CandidatePool = {
  poolId: PoolId;
  lpAssetId: string;
  isStable: boolean;
  assetA: CoinData;
  assetB: CoinData;
  lpTokenBalance: BN;
};

function getKnownPoolCandidates(): Omit<CandidatePool, "lpTokenBalance">[] {
  const knownAssets = Array.from(coinsConfig.values()).filter(
    (asset, index, allAssets) =>
      asset.assetId &&
      allAssets.findIndex((other) => other.assetId === asset.assetId) === index
  );

  const candidates: Omit<CandidatePool, "lpTokenBalance">[] = [];

  for (let i = 0; i < knownAssets.length; i += 1) {
    for (let j = i + 1; j < knownAssets.length; j += 1) {
      for (const isStable of [false, true]) {
        const poolId = buildPoolId(
          knownAssets[i].assetId,
          knownAssets[j].assetId,
          isStable
        );
        const lpAssetId = getLPAssetId(DEFAULT_AMM_CONTRACT_ID, poolId).bits;

        candidates.push({
          poolId,
          lpAssetId,
          isStable,
          assetA: knownAssets[i],
          assetB: knownAssets[j],
        });
      }
    }
  }

  return candidates;
}

const knownPoolCandidates = getKnownPoolCandidates();

export function useKnownAssetLiquidityPositions() {
  const mira = useReadonlyMira();
  const {balances, balancesPending, refetchBalances} = useBalances();

  const balanceKey = useMemo(
    () =>
      balances
        ?.map((balance) => `${balance.assetId}:${balance.amount.toString()}`)
        .sort()
        .join("|"),
    [balances]
  );

  const query = useQuery({
    queryKey: ["knownAssetLiquidityPositions", balanceKey],
    queryFn: async () => {
      const balanceByAssetId = new Map(
        balances
          ?.filter((balance) => !balance.amount.isZero())
          .map((balance) => [balance.assetId, balance.amount]) ?? []
      );

      const matchingCandidates: CandidatePool[] = knownPoolCandidates
        .map((candidate) => {
          const lpTokenBalance = balanceByAssetId.get(candidate.lpAssetId);

          return lpTokenBalance
            ? {
                ...candidate,
                lpTokenBalance,
              }
            : null;
        })
        .filter((candidate): candidate is CandidatePool => candidate !== null);

      const settledPositions = await Promise.allSettled(
        matchingCandidates.map(async (candidate) => {
          const underlyingAssets = await mira!.getLiquidityPosition(
            candidate.poolId,
            candidate.lpTokenBalance,
            {useCache: false}
          );

          return {
            ...candidate,
            underlyingAssets,
          };
        })
      );

      return settledPositions
        .filter(
          (
            result
          ): result is PromiseFulfilledResult<KnownAssetLiquidityPosition> =>
            result.status === "fulfilled"
        )
        .map((result) => result.value);
    },
    enabled: Boolean(mira) && Boolean(balances),
  });

  return {
    ...query,
    isLoading: balancesPending || query.isLoading,
    candidateCount: knownPoolCandidates.length,
    refetchBalances,
  };
}
