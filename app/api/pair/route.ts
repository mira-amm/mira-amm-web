import {NextResponse} from "next/server";
import {request, gql} from "graphql-request";
import {SQDIndexerUrl} from "@/src/utils/constants"; // Replace with your actual GraphQL endpoint

// Define the structure for the Pool and related assets
interface Asset {
  id: string;
}

interface Pool {
  asset0: Asset;
  asset1: Asset;
  feesUSD: string;
}

// Define the schema for the pair (pool) response
interface PairResponse {
  poolById: Pool;
}

// Handle GET requests for /api/pair
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const poolId = url.searchParams.get("id");

    // Return a 400 error if no 'id' is provided
    if (!poolId) {
      return NextResponse.json({error: "Pool ID is required"}, {status: 400});
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
      poolById: Pool;
    }>({
      url: SQDIndexerUrl,
      document: query,
      variables: {id: poolId},
    });

    // Return the fetched pool(pair) data
    return NextResponse.json({pair: data.poolById});
  } catch (error) {
    console.error("Error fetching pair data:", error);

    // Return an error response if the request fails
    return NextResponse.json(
      {error: "Failed to fetch pool data"},
      {status: 500},
    );
  }
}
