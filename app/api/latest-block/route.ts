/**
 * @api {get} /latest-block Get latest block data (only if events data available for the block)
 */
// library
import {NextRequest, NextResponse} from "next/server";
import {request, gql} from "graphql-request";
import {DateTime} from "fuels";

// local imports
import {SQDIndexerUrl, MainnetNetworkUrl} from "@/src/utils/constants";
import {
  FuelAPIResponses,
  GeckoTerminalQueryResponses,
  SQDIndexerResponses,
} from "@/app/api/shared/types";

// Function to fetch the squid status (height)
async function fetchSquidStatus(
  url: string,
): Promise<SQDIndexerResponses.SquidStatus> {
  const query = gql`
    query GetSquidStatus {
      squidStatus {
        finalizedHeight
      }
    }
  `;

  try {
    const response = await request<{
      squidStatus: SQDIndexerResponses.SquidStatus;
    }>({
      url,
      document: query,
    });

    return response.squidStatus;
  } catch (error) {
    console.error("Error fetching squid status:", error);
    throw error;
  }
}

// Function to fetch the block data by height (timestamp)
async function fetchBlockByHeight(
  url: string,
  height: string,
): Promise<FuelAPIResponses.BlockByHeight> {
  const query = gql`
    query GetBlockByHeight($height: String!) {
      block(height: $height) {
        header {
          time
        }
      }
    }
  `;

  try {
    const response = await request<{block: FuelAPIResponses.BlockByHeight}>({
      url,
      document: query,
      variables: {height},
    });

    return response.block;
  } catch (error) {
    console.error("Error fetching block by height:", error);
    throw error;
  }
}

// Handle GET requests for /api/latest-block
export async function GET(req: NextRequest) {
  try {
    // Fetch the squid status to get the current height (latest block)
    const squidStatus = await fetchSquidStatus(SQDIndexerUrl);

    const blockNumber = squidStatus.finalizedHeight; // Latest block number

    // Fetch the block data (timestamp) using the block number
    const blockData = await fetchBlockByHeight(
      MainnetNetworkUrl,
      blockNumber.toString(),
    );

    const tai64TimeString = blockData.header.time.toString();

    // converting TAI64 string to normal datetime
    const blockDateTime: DateTime = DateTime.fromTai64(tai64TimeString);
    const blockTimeStampInSeconds = blockDateTime.toUnixSeconds();

    // Combine block number (height) and block timestamp
    const block: GeckoTerminalQueryResponses.Block = {
      blockNumber,
      blockTimestamp: blockTimeStampInSeconds,
    };

    const latestBlockResponse: GeckoTerminalQueryResponses.LatestBlockResponse =
      {
        block,
      };

    // Return the block data
    return NextResponse.json(latestBlockResponse);
  } catch (error) {
    console.error("error fetching latest block:", error);
    return NextResponse.json(
      {error: "An unexpected error occurred while fetching latest block"},
      {status: 500},
    );
  }
}
