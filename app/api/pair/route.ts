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

// Function to fetch pool details by ID
async function fetchPoolById(
  poolId: string,
): Promise<SQDIndexerResponses.Pool> {
  // Define the GraphQL query to fetch pool details by the given id
  const query = gql`
    query GetPairById($id: String!) {
      poolById(id: $id) {
        id
        asset0 {
          id
        }
        asset1 {
          id
        }
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
  // return pool/pair data
  return response.poolById;
}

function createPairFromPool(
  pool: SQDIndexerResponses.Pool,
): GeckoTerminalQueryResponses.Pair {
  /*********************************************
   * HARDCODED - dexKey, createdAtBlockNumber,createdAtBlockTimestamp, createdAtTxnId:
   *********************************************/
  const pair: GeckoTerminalQueryResponses.Pair = {
    id: pool.id,
    dexKey: "uniswap",
    asset0Id: pool.asset0.id,
    asset1Id: pool.asset1.id,
    createdAtBlockNumber: 123,
    createdAtBlockTimestamp: 123,
    createdAtTxnId: "DUMMY_ID",
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

    // Fetch the pool details using the helper function
    const pool = await fetchPoolById(poolId);
    const pair = createPairFromPool(pool);
    const pairResponse: GeckoTerminalQueryResponses.PairResponse = {
      pair,
    };
    // Return the fetched pool(pair) data
    return NextResponse.json(pairResponse);
  } catch (error) {
    console.error("Error fetching pair data:", error);

    // Return an error response if the request fails
    return NextResponse.json(
      {error: "Failed to fetch pair data"},
      {status: 500},
    );
  }
}
