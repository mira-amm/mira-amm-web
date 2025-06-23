import { useMemo } from "react";
import { BASE_ASSETS, CoinData } from "../utils/coinsConfig";

const BASE_PAIRS: [CoinData, CoinData][] = BASE_ASSETS.flatMap((base) =>
  BASE_ASSETS.map((otherBase) => [base, otherBase] as [CoinData, CoinData]),
).filter(([a, b]) => a.assetId !== b.assetId);

export const useAllAssetsCombination = (
  assetA?: CoinData,
  assetB?: CoinData,
): [CoinData, CoinData][] => {
  return useMemo(() => {
    if (!assetA || !assetB) return [];

    const seen = new Set<string>();
    const addPair = (a: CoinData, b: CoinData, acc: [CoinData, CoinData][]) => {
      if (a.assetId === b.assetId) return acc;
      const key = [a.assetId, b.assetId].sort().join("-");
      if (!seen.has(key)) {
        seen.add(key);
        acc.push([a, b]);
      }
      return acc;
    };

    let combinations: [CoinData, CoinData][] = [];

    addPair(assetA, assetB, combinations);

    BASE_ASSETS.forEach((base) => addPair(assetA, base, combinations));

    BASE_ASSETS.forEach((base) => addPair(assetB, base, combinations));

    BASE_PAIRS.forEach(([a, b]) => addPair(a, b, combinations));

    return combinations;
  }, [assetA, assetB]);
};
