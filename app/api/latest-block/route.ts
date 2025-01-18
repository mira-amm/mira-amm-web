/**
 * @api {get} /latest-block Get latest block data (only if events data available for the block)
 */
// library
import {NextRequest, NextResponse} from "next/server";
import {request, gql} from "graphql-request";

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
        height
      }
    }
  `;

  try {
    const data = await request<{squidStatus: SQDIndexerResponses.SquidStatus}>({
      url,
      document: query,
    });

    return data.squidStatus;
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
    const data = await request<{block: FuelAPIResponses.BlockByHeight}>({
      url,
      document: query,
      variables: {height},
    });

    return data.block;
  } catch (error) {
    console.error("Error fetching block data:", error);
    throw new Error("Failed to fetch block data");
  }
}

function convertNanosecondsToUnixSeconds(nsTimestamp: number): number {
  /*********************************************
   *  QUESTION 1:
   *  here I have taken out milliseconds as per requirement using Math.floor which will take the second part even if decimal part is above .5
   * for example: 4611686020.890 will be treated as 4611686020
   *********************************************/

  // Convert nanoseconds to seconds by dividing by 1 billion
  return Math.floor(nsTimestamp / 1e9);
}

// Handle GET requests for /api/latest-block
export async function GET(req: NextRequest) {
  try {
    // Fetch the squid status to get the current height (latest block)
    const squidStatus = await fetchSquidStatus(SQDIndexerUrl);
    const blockNumber = squidStatus.height; // Latest block number

    /*********************************************
     *  QUESTION 2:
     *  How to retrieve the events for a single block (for events api we need two params - toBlock & fromBlock)
     *  commented out code for now
     *  Would appreciate any insights! 🙏
     *********************************************/

    // Fetch events for the latest block
    // const eventsData = await fetchEventsForBlock(blockNumber);

    // If no events are found for the block, return null
    // if (eventsData.actions.length === 0) {
    //   return NextResponse.json({block: null});
    // }

    // Fetch the block data (timestamp) using the block number
    const blockData = await fetchBlockByHeight(
      NetworkUrl,
      blockNumber.toString(),
    );

    const nanoseconds = blockData.header.time;
    const unixSeconds = convertNanosecondsToUnixSeconds(nanoseconds);

    // Combine block number (height) and block timestamp
    const block: GeckoTerminalQueryResponses.Block = {
      blockNumber,
      blockTimestamp: unixSeconds, // Timestamp from the block header
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
