import { buildPoolId, PoolId } from "mira-dex-ts";
import { CoinData } from "../utils/coinsConfig";
import type { Pool, Route } from "./useGetPoolsWithReserve";

// Check if a given pool involves the specified asset
function involvesAssetInPool(pool: Pool, asset: CoinData): boolean {
  return (
    pool.assetA.assetId === asset.assetId ||
    pool.assetB.assetId === asset.assetId
  );
}

// Compare two pools by their poolId
function poolEquals(a: Pool, b: Pool): boolean {
  return JSON.stringify(a.poolId) === JSON.stringify(b.poolId);
}

// Build up to `maxHops` routes from assetIn to assetOut through available pools
export function computeAllRoutes(
  assetIn: CoinData,
  assetOut: CoinData,
  pools: Pool[],
  maxHops = 2
): Route[] {
  const results: Route[] = [];

  function recurse(
    current: CoinData,
    path: Pool[],
    hopsLeft: number
  ) {
    for (const p of pools) {
      if (!involvesAssetInPool(p, current) || path.some(pp => poolEquals(pp, p))) {
        continue;
      }
      // determine the next token
      const nextToken =
        p.assetA.assetId === current.assetId ? p.assetB : p.assetA;
      const nextPath = [...path, p];

      if (nextToken.assetId === assetOut.assetId) {
        results.push({ pools: nextPath, assetIn, assetOut });
      } else if (hopsLeft > 1) {
        recurse(nextToken, nextPath, hopsLeft - 1);
      }
    }
  }

  recurse(assetIn, [], maxHops);
  return results;
}

//  Given pairs of assets, build de-duped stable/volatile pool IDs
export function getPoolIdCombinations(
  pairs: [CoinData, CoinData][]
): Array<[CoinData, CoinData, PoolId, boolean]> {
  const seen = new Set<string>();
  const combos: Array<[CoinData, CoinData, PoolId, boolean]> = [];

  for (const [a, b] of pairs) {
    const stableKey = `${a.assetId}-${b.assetId}-true`;
    const volatileKey = `${a.assetId}-${b.assetId}-false`;
    const stableId = buildPoolId(a.assetId, b.assetId, true);
    const volatileId = buildPoolId(a.assetId, b.assetId, false);

    if (!seen.has(stableKey)) {
      seen.add(stableKey);
      combos.push([a, b, stableId, true]);
    }
    if (!seen.has(volatileKey)) {
      seen.add(volatileKey);
      combos.push([a, b, volatileId, false]);
    }
  }
  return combos;
}
