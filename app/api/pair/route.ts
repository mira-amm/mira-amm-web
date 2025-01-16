import {NextResponse} from "next/server";
import {request, gql} from "graphql-request";
import {SQDIndexerUrl} from "@/src/utils/constants";
import {SQDIndexerResponses} from "../shared/types";

// Handle GET requests for /api/pair
export async function GET(req: Request) {
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

    // Define the GraphQL query to fetch pool details by the given id
    const query = gql`
      query GetPairById($id: String!) {
        poolById(id: $id) {
          asset0 {
            id
          }
          asset1 {
            id
          }
          feesUSD
        }
      }
    `;

    // Send the GraphQL request to the indexer server to fetch the pool data
    const data = await request<{
      poolById: SQDIndexerResponses.Pool;
    }>({
      url: SQDIndexerUrl,
      document: query,
      variables: {id: poolId},
    });

    // hardcoded some fields
    const queryResponse = {...data.poolById, dexType: "uniswap"};

    // Return the fetched pool(pair) data
    return NextResponse.json({pair: queryResponse});
  } catch (error) {
    console.error("Error fetching pair data:", error);

    // Return an error response if the request fails
    return NextResponse.json(
      {error: "Failed to fetch pool data"},
      {status: 500},
    );
  }
}
