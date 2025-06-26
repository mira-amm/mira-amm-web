import request, { gql } from 'graphql-request';
import { PoolId } from 'mira-dex-ts';
import { SQDIndexerUrl } from '../utils/constants';
import type { CoinData } from '../utils/coinsConfig';

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
  const chunks = chunk(poolKeys, 10);
  const allResults: Pool[] = [];

  for (const keysChunk of chunks) {
    const aliasMap = keysChunk.map(([a, b, [assetA, assetB, stable]], idx) => {
      const alias = String.fromCharCode(97 + idx);
      const id = `${assetA.bits}-${assetB.bits}-${stable}`;
      return { alias, a, b, id };
    });

    const queries = aliasMap
      .map(({ alias, id }) => `
        ${alias}: poolById(id: "${id}") {
          reserve0
          reserve1
        }
      `)
      .join('\n');

    const gqlQuery = gql`
      query MultiPoolReserve {
        ${queries}
      }
    `;

    const response = await request<Record<string, PoolReserveData | null>>(
      SQDIndexerUrl,
      gqlQuery
    );

    for (let idx = 0; idx < aliasMap.length; idx++) {
      const { alias, a, b, id: _ } = aliasMap[idx];
      const data = response[alias];
      if (data) {
        const poolId = keysChunk[idx][2];
        allResults.push({
          assetA: a,
          assetB: b,
          poolId,
          reserve0: data.reserve0,
          reserve1: data.reserve1,
        });
      }
    }
  }

  return allResults;
}
