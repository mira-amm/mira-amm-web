import {PoolId} from "mira-dex-ts";
import type {CoinData} from "../utils/coinsConfig";
import {getServerIndexer} from "@/indexer";

export type PoolReserveData = {
  reserve0: string;
  reserve1: string;
};

export type Pool = {
  assetA: CoinData;
  assetB: CoinData;
  poolId: PoolId;
} & PoolReserveData;

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    out.push(arr.slice(i, i + size));
  }
  return out;
}

export async function fetchPoolsWithReserve(
  poolKeys: Array<[CoinData, CoinData, PoolId, boolean]>
): Promise<Pool[]> {
  const indexer = getServerIndexer();
  const chunks = chunk(poolKeys, 10);
  const allResults: Pool[] = [];

  for (const keysChunk of chunks) {
    const poolIds = keysChunk.map(([_a, _b, [assetA, assetB, stable]]) => {
      return `${assetA.bits}-${assetB.bits}-${stable}`;
    });

    // Fetch pool reserves using the indexer
    const poolsWithReserves = await indexer.pools.getWithReserves(poolIds);

    for (let idx = 0; idx < keysChunk.length; idx++) {
      const [a, b, poolId] = keysChunk[idx];
      const poolIdString = poolIds[idx];
      const poolData = poolsWithReserves.find((p) => p.id === poolIdString);

      if (poolData && poolData.reserve0 && poolData.reserve1) {
        allResults.push({
          assetA: a,
          assetB: b,
          poolId,
          reserve0: poolData.reserve0,
          reserve1: poolData.reserve1,
        });
      }
    }
  }

  return allResults;
}
