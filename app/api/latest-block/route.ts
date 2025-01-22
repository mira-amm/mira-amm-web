/**
 * @api {get} /latest-block Get latest block data (only if events data available for the block)
 */
// library
import {NextRequest, NextResponse} from "next/server";
import {request, gql} from "graphql-request";
import {DateTime} from "fuels";
import {
  convertTAI64StringToUnixSeconds,
  convertUnixMillisecondsToUnixSeconds,
} from "../shared/math";

// local imports
import {SQDIndexerUrl, NetworkUrl} from "@/src/utils/constants";
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
    throw new Error("Failed to fetch squid status");
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
    console.error("Error fetching block data:", error);
    throw new Error("Failed to fetch block data");
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
      NetworkUrl,
      blockNumber.toString(),
    );

    let tai64TimeString = blockData.header.time.toString();

    // converting TAI64 string to normal datetime
    const tai64: DateTime = convertTAI64StringToUnixSeconds(tai64TimeString);

    const blockTimeStampInSeconds = convertUnixMillisecondsToUnixSeconds(
      tai64.getTime(),
    );

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
    console.error("Error fetching block and events:", error);

    return NextResponse.json(
      {error: "Failed to fetch block and events"},
      {status: 500},
    );
  }
}
