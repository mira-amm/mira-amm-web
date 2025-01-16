import {NextResponse} from "next/server";
import {request, gql} from "graphql-request";
import {SQDIndexerUrl} from "@/src/utils/constants";
import {
  GeckoTerminalQueryResponses,
  SQDIndexerResponses,
} from "../shared/types";
import {GeckoTerminalTypes, SQDIndexerTypes} from "../shared/constants";
import {decimalize} from "../shared/math";

interface FetchEventsParams {
  fromBlock: number;
  toBlock: number;
}

// Helper function to fetch and process events data for a block range
async function fetchEventsForBlockRange({
  fromBlock,
  toBlock,
}: FetchEventsParams): Promise<SQDIndexerResponses.Actions> {
  /*********************************************
   * QUERY CHANGE REQUIRED:
   * This query returns correctly for swap, but need to confirm for JOIN_EXIT instead of ADD_LIQUIDITY
   * (SQD has three options- ADD_LIQUIDITY REMOVE_LIQUIDITY and SWAP)
   *********************************************/

  const query = gql`
    query GetActions($fromBlock: Int!, $toBlock: Int!) {
      actions(
        where: {
          blockNumber_gt: $fromBlock
          blockNumber_lt: $toBlock
          type_eq: SWAP
          OR: [
            {
              blockNumber_gt: $fromBlock
              blockNumber_lt: $toBlock
              type_eq: ADD_LIQUIDITY
            }
          ]
        }
      ) {
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
    /*********************************************
     * QUESTION 1:
     * Currently just hardcoding JOIN
     * How to handle JOIN and EXIT separately ,maybe with FUEL API (need to check)
     *********************************************/
    eventType: GeckoTerminalTypes.EventTypes.JOIN,
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

  console.log(action);
  console.log(action.asset1);
  /*********************************************
   * HARDCODED DECIMALIZE TO 6 : (need fix)
   *********************************************/
  let asset0Decimals = 6;
  let asset1Decimals = 6;

  // not adding "0" value to the output as per the Gecko Terminal spec( only one pair should be present at any given)
  if (action.amount0In != "0" && action.amount1Out != "0") {
    event = {
      ...event,
      asset0In: decimalize(action.amount0In, asset0Decimals),
      asset1Out: decimalize(action.amount1Out, asset1Decimals),
    };
  } else if (action.amount1In != "0" && action.amount0Out != "0") {
    event = {
      ...event,
      asset1In: decimalize(action.amount1In, asset1Decimals),
      asset0Out: decimalize(action.amount0Out, asset0Decimals),
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
    console.log(eventsData.actions);
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
