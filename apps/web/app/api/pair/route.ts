/**
 * @api {get} /pair Get pair details by id
 */
import {NextRequest, NextResponse} from "next/server";
import {request, gql} from "graphql-request";
import {SQDIndexerUrl} from "../../../../../libs/web/src/utils/constants";
import {
  SQDIndexerResponses,
  GeckoTerminalQueryResponses,
} from "../../../../../libs/web/shared/types";
import {NotFoundError} from "../../../../../libs/web/src/utils/errors";

export const fetchPoolById = async (
  poolId: string
): Promise<SQDIndexerResponses.Pool> => {
  const query = gql`
    query GetPoolById($id: String!) {
      poolById(id: $id) {
        id
        asset0 {
          id
        }
        asset1 {
          id
        }
        creationBlock
        creationTime
        creationTx
        protocolVersion
        binStepBps
        baseFee
      }
    }
  `;

  const {poolById} = await request<{poolById: SQDIndexerResponses.Pool}>({
    url: SQDIndexerUrl,
    document: query,
    variables: {id: poolId},
  });

  if (!poolById) {
    throw new NotFoundError(`Pool with ID: ${poolId} not found`);
  }

  return poolById;
};

export const createPairFromPool = (
  pool: SQDIndexerResponses.Pool
): GeckoTerminalQueryResponses.Pair => {
  // Calculate feeBps based on protocol version
  // V2 pools: fee = (binStepBps * baseFee) / 10000
  // V1 pools: standard 0.3% fee (30 bps)
  let feeBps: number | undefined;

  if (pool.protocolVersion === 2 && pool.binStepBps && pool.baseFee) {
    // For V2 pools, calculate the effective fee in basis points
    feeBps = (pool.binStepBps * pool.baseFee) / 10000;
  } else if (pool.protocolVersion === 1) {
    // V1 pools have a standard 0.3% fee
    feeBps = 30;
  }

  return {
    id: pool.id,
    dexKey: "mira",
    asset0Id: pool.asset0.id,
    asset1Id: pool.asset1.id,
    createdAtBlockNumber: pool.creationBlock,
    createdAtBlockTimestamp: pool.creationTime,
    createdAtTxnId: pool.creationTx,
    feeBps,
  };
};

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
