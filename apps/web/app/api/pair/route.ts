/**
 * @api {get} /pair Get pair details by id
 */
import {NextRequest, NextResponse} from "next/server";
import {getServerIndexer} from "@/indexer";
import {
  SQDIndexerResponses,
  GeckoTerminalQueryResponses,
} from "../../../../../libs/web/shared/types";
import {NotFoundError} from "../../../../../libs/web/src/utils/errors";

export const fetchPoolById = async (
  poolId: string
): Promise<SQDIndexerResponses.Pool> => {
  // Use the indexer abstraction
  const indexer = getServerIndexer();
  const pool = await indexer.pools.getById(poolId);

  if (!pool) {
    throw new NotFoundError(`Pool with ID: ${poolId} not found`);
  }

  // Transform to match expected response type
  return {
    id: pool.id,
    asset0: {
      id: pool.asset0Id,
    },
    asset1: {
      id: pool.asset1Id,
    },
    creationBlock: pool.creationBlock,
    creationTime: pool.creationTime,
    creationTx: pool.creationTx,
  };
};

export const createPairFromPool = (
  pool: SQDIndexerResponses.Pool
): GeckoTerminalQueryResponses.Pair => ({
  id: pool.id,
  dexKey: "mira",
  asset0Id: pool.asset0.id,
  asset1Id: pool.asset1.id,
  createdAtBlockNumber: pool.creationBlock,
  createdAtBlockTimestamp: pool.creationTime,
  createdAtTxnId: pool.creationTx,
});

export async function GET(req: NextRequest) {
  try {
    const poolId = new URL(req.url).searchParams.get("id");

    if (!poolId) {
      return NextResponse.json(
        {error: "Pool ID(param: id) is required"},
        {status: 400}
      );
    }

    const pool = await fetchPoolById(poolId);

    const pair: GeckoTerminalQueryResponses.Pair = createPairFromPool(pool);

    const pairResponse: GeckoTerminalQueryResponses.PairResponse = {pair};

    return NextResponse.json(pairResponse);
  } catch (error) {
    console.error("Error fetching pair data:", error);

    if (error instanceof NotFoundError) {
      return NextResponse.json({error: error.message}, {status: 404});
    }

    return NextResponse.json(
      {error: "An unexpected error occurred while fetching pair data"},
      {status: 500}
    );
  }
}
