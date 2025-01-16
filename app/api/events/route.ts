// import {NextResponse} from "next/server";
// import {request, gql} from "graphql-request";
// import {SQDIndexerUrl} from "@/src/utils/constants";

// // Define the Block interface
// interface Block {
//   blockNumber: number;
//   blockTimestamp: number;
// }

// // Define the structure for reserves
// interface Reserves {
//   asset0: string;
//   asset1: string;
// }

// // Define the structure for JoinExitEvent
// interface JoinExitEvent {
//   eventType: "join";
//   txnId: string;
//   txnIndex: number;
//   eventIndex: number;
//   maker: string;
//   pairId: string;
//   amount0: string;
//   amount1: string;
//   reserves: Reserves;
// }

// // Define the structure for SwapEvent
// interface SwapEvent {
//   eventType: "swap";
//   txnId: string;
//   txnIndex: number;
//   eventIndex: number;
//   maker: string;
//   pairId: string;
//   asset0In: string;
//   asset1Out: string;
//   priceNative: string;
//   reserves: Reserves;
// }

// // Define the schema for the events response
// interface EventsResponse {
//   actions: Array<{
//     pool: {id: string};
//     amount0In: string;
//     amount1In: string;
//     amount0Out: string;
//     amount1Out: string;
//     reserves0After: string;
//     reserves1After: string;
//     type: string;
//     transaction: string;
//     timestamp: number;
//     blockNumber: number;
//   }>;
// }

// // Handle GET requests for /api/events
// export async function GET(req: Request) {
//   try {
//     // Extract query parameters from the request URL
//     const url = new URL(req.url);
//     const fromBlock = parseInt(url.searchParams.get("fromBlock") || "0", 10);
//     const toBlock = parseInt(url.searchParams.get("toBlock") || "0", 10);

//     // Return a 400 error if fromBlock or toBlock is not provided
//     if (!fromBlock || !toBlock) {
//       return NextResponse.json(
//         {error: "Both 'fromBlock' and 'toBlock' are required"},
//         {status: 400},
//       );
//     }

//     // Define the GraphQL query to fetch actions within the given block range
//     const query = gql`
//       query GetActions($fromBlock: Int!, $toBlock: Int!) {
//         actions(where: {blockNumber_gt: $fromBlock, blockNumber_lt: $toBlock}) {
//           pool {
//             id
//           }
//           amount1Out
//           amount1In
//           amount0Out
//           amount0In
//           reserves0After
//           reserves1After
//           type
//           transaction
//           timestamp
//           blockNumber
//         }
//       }
//     `;

//     // Send the GraphQL request to the indexer server to fetch actions
//     const data = await request<EventsResponse>({
//       url: SQDIndexerUrl,
//       document: query,
//       variables: {fromBlock, toBlock},
//     });

//     // Reformat the data to match your expected output
//     const events = data.actions.map((action) => {
//       const block: Block = {
//         blockNumber: action.blockNumber,
//         blockTimestamp: action.timestamp,
//       };

//       // Identify the event type based on action type
//       const isJoinExitEvent = action.type === "JOIN_EXIT";
//       const isSwapEvent = action.type === "SWAP";

//       const eventData: JoinExitEvent | SwapEvent = {
//         txnId: action.transaction,
//         txnIndex: 0, // Assuming the index values are not present; setting as 0 for now
//         eventIndex: 0, // Assuming the index values are not present; setting as 0 for now
//         maker: action.pool.id, // Using pool ID as maker for this example
//         pairId: action.pool.id, // Using pool ID as pairId
//         reserves: {
//           asset0: action.reserves0After,
//           asset1: action.reserves1After,
//         },
//         eventType: isJoinExitEvent ? "join" : "swap", // Mapping event type
//         amount0: isJoinExitEvent ? action.amount0In : action.amount0Out,
//         amount1: isJoinExitEvent ? action.amount1In : action.amount1Out,
//         asset0In: isSwapEvent ? action.amount0In : "0",
//         asset1Out: isSwapEvent ? action.amount1Out : "0",
//         priceNative: isSwapEvent
//           ? (
//               parseFloat(action.amount0In) / parseFloat(action.amount1Out)
//             ).toString()
//           : "0",
//       };

//       return {
//         block,
//         ...eventData,
//       };
//     });

//     // Return the reformatted events data
//     return NextResponse.json({events});
//   } catch (error) {
//     console.error("Error fetching events:", error);

//     // Return an error response if the request fails
//     return NextResponse.json(
//       {error: "Failed to fetch events data"},
//       {status: 500},
//     );
//   }
// }

import {NextResponse} from "next/server";
import {request, gql} from "graphql-request";
import {SQDIndexerUrl} from "@/src/utils/constants";
import {
  GeckoTerminalQueryResponses,
  SQDIndexerResponses,
} from "../shared/types";

interface FetchEventsParams {
  fromBlock: number;
  toBlock: number;
}

// Helper function to fetch and process events data for a block range
async function fetchEventsForBlockRange({
  fromBlock,
  toBlock,
}: FetchEventsParams): Promise<SQDIndexerResponses.Actions> {
  const query = gql`
    query GetActions($fromBlock: Int!, $toBlock: Int!) {
      actions(where: {blockNumber_gt: $fromBlock, blockNumber_lt: $toBlock}) {
        pool {
          id
        }
        amount1Out
        amount1In
        amount0Out
        amount0In
        reserves0After
        reserves1After
        type
        transaction
        timestamp
        blockNumber
      }
    }
  `;

  try {
    // Send the GraphQL request to fetch events
    const data = await request<SQDIndexerResponses.Actions>({
      url: SQDIndexerUrl,
      document: query,
      variables: {fromBlock, toBlock},
    });

    return data; // Return the data with events
  } catch (error) {
    console.error(
      `Error fetching events for block range ${fromBlock} - ${toBlock}:`,
      error,
    );
    throw new Error(
      `Error fetching events for block range ${fromBlock} - ${toBlock}:`,
    );
  }
}

// Helper function to fetch and process events data for a single block
export async function fetchEventsForBlock(
  blockNumber: number,
): Promise<SQDIndexerResponses.Actions> {
  const query = gql`
    query GetActions($blockNumber: Int!) {
      actions(where: {blockNumber_eq: $blockNumber}) {
        pool {
          id
        }
        amount1Out
        amount1In
        amount0Out
        amount0In
        reserves0After
        reserves1After
        type
        transaction
        timestamp
        blockNumber
      }
    }
  `;

  try {
    // Send the GraphQL request to fetch events
    const data = await request<SQDIndexerResponses.Actions>({
      url: SQDIndexerUrl,
      document: query,
      variables: {blockNumber},
    });

    return data; // Return the data with events
  } catch (error) {
    console.error(`Error fetching events for block ${blockNumber}:`, error);
    throw new Error(`Error fetching events for block ${blockNumber}:`);
  }
}

function createEventDataForJoinExitEvent(
  action: SQDIndexerResponses.Action,
): GeckoTerminalQueryResponses.JoinExitEvent {
  return {
    txnId: action.transaction,
    txnIndex: 0,
    eventIndex: 0,
    maker: action.pool.id,
    pairId: action.pool.id,
    reserves: {
      asset0: action.reserves0After,
      asset1: action.reserves1After,
    },
    eventType: "join",
    amount0: action.amount0In,
    amount1: action.amount1In,
  };
}

function createEventDataForSwapEvent(
  action: SQDIndexerResponses.Action,
): GeckoTerminalQueryResponses.SwapEvent {
  let event = {
    txnId: action.transaction,
    txnIndex: 0,
    eventIndex: 0,
    maker: action.pool.id,
    pairId: action.pool.id,
    reserves: {
      asset0: action.reserves0After,
      asset1: action.reserves1After,
    },
    eventType: "swap",
    priceNative: parseFloat(action.amount0In) / parseFloat(action.amount1Out),
  } as GeckoTerminalQueryResponses.SwapEvent;

  if (action.amount0In != "0" && action.amount1Out != "0") {
    event = {
      ...event,
      asset0In: action.amount0In,
      asset1Out: action.amount1Out,
    };
  } else if (action.amount1In != "0" && action.amount0Out != "0") {
    event = {
      ...event,
      asset1In: action.amount1In,
      asset0Out: action.amount0Out,
    };
  } else {
    throw new Error(`Invalid swap event data: ${JSON.stringify(action)}`);
  }
  return event;
}

// Handle GET requests for /api/events
export async function GET(req: Request) {
  try {
    // Extract query parameters from the request URL
    const url = new URL(req.url);
    const fromBlock = parseInt(url.searchParams.get("fromBlock") || "0", 10);
    const toBlock = parseInt(url.searchParams.get("toBlock") || "0", 10);

    // Return a 400 error if fromBlock or toBlock is not provided
    if (!fromBlock || !toBlock) {
      return NextResponse.json(
        {error: "Both 'fromBlock' and 'toBlock' are required"},
        {status: 400},
      );
    }

    // Fetch events data for the given block range
    const eventsData = await fetchEventsForBlockRange({fromBlock, toBlock});

    // If no actions are found, return empty events list
    if (eventsData.actions.length === 0) {
      return NextResponse.json({events: []});
    }

    // Process the fetched events and map them to the expected format
    const events = eventsData.actions.map(
      (action: SQDIndexerResponses.Action) => {
        const block: GeckoTerminalQueryResponses.Block = {
          blockNumber: action.blockNumber,
          blockTimestamp: action.timestamp,
        };

        // Identify event type
        const isJoinExitEvent = action.type === "JOIN_EXIT";
        const isSwapEvent = action.type === "SWAP";
        let eventData:
          | GeckoTerminalQueryResponses.JoinExitEvent
          | GeckoTerminalQueryResponses.SwapEvent
          | null = null;
        // Extracting necessary data from action and creating respective event(join/swap)
        if (isJoinExitEvent) {
          eventData = createEventDataForJoinExitEvent(action);
        } else if (isSwapEvent) {
          eventData = createEventDataForSwapEvent(action);
        }

        // Return null when eventData is not created
        if (!eventData) {
          if (!eventData) {
            console.warn(`Unknown event type: ${action.type}. Possible reasons: 
              1. Malformed data (e.g., missing properties: ${JSON.stringify(action)}) 
              2. Unexpected event type (action.type is not 'JOIN_EXIT' or 'SWAP')
              3. Issue with event creation functions.`);
            return;
          }
          return null;
        }

        return {
          block,
          ...eventData,
        };
      },
    );

    // Return the formatted events data
    return NextResponse.json({events});
  } catch (error) {
    console.error("Error fetching events:", error);
    return NextResponse.json(
      {error: "Failed to fetch events data"},
      {status: 500},
    );
  }
}
