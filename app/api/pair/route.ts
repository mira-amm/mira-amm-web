/**
 * @api {get} /pair Get pair details by id
 */
import {NextRequest, NextResponse} from "next/server";
import {request, gql} from "graphql-request";
import {SQDIndexerUrl} from "@/src/utils/constants";
import {
  SQDIndexerResponses,
  GeckoTerminalQueryResponses,
} from "../shared/types";
import {NotFoundError} from "@/src/utils/errors";

// Function to fetch pool details by ID
async function fetchPoolById(
  poolId: string,
): Promise<SQDIndexerResponses.Pool> {
  // Define the GraphQL query to fetch pool details by the given id
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
      }
    }
  `;

  // Send the GraphQL request to the indexer server to fetch the pool data
  const response = await request<{
    poolById: SQDIndexerResponses.Pool;
  }>({
    url: SQDIndexerUrl,
    document: query,
    variables: {id: poolId},
  });

  // throw error if pool is not found
  if (!response.poolById) {
    throw new NotFoundError(`Pool with ID: ${poolId} not found`);
  }

  // return pool/pair data
  return response.poolById;
}

function createPairFromPool(
  pool: SQDIndexerResponses.Pool,
): GeckoTerminalQueryResponses.Pair {
  const pair: GeckoTerminalQueryResponses.Pair = {
    id: pool.id,
    dexKey: "mira",
    asset0Id: pool.asset0.id,
    asset1Id: pool.asset1.id,
    createdAtBlockNumber: pool.creationBlock,
    createdAtBlockTimestamp: pool.creationTime,
    createdAtTxnId: pool.creationTx,
  };

  return pair;
}

// Handle GET requests for /api/pair
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const poolId = url.searchParams.get("id");

    // Return a 400 error if no 'id' is provided
    if (!poolId) {
      return NextResponse.json(
        {error: "Pool ID(param: id) is required"},
        {status: 400},
      );
    }

    // Fetch the pool details
    const pool = await fetchPoolById(poolId);
    // Format pool data (pair and pool are synonymous) according to Gecko spec
    const pair = createPairFromPool(pool);
    const pairResponse: GeckoTerminalQueryResponses.PairResponse = {
      pair,
    };
    // Return the fetched pool(pair) data
    return NextResponse.json(pairResponse);
  } catch (error) {
    console.error("Error fetching pair data:", error);

    if (error instanceof NotFoundError) {
      return NextResponse.json({error: error.message}, {status: 404});
    }

    return NextResponse.json(
      {error: "An unexpected error occurred while fetching pair data"},
      {status: 500},
    );
  }
}
