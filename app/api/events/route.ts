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
        asset0 {
          id
          decimals
        }
        asset1 {
          id
          decimals
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

function createEventDataForJoinExitEvent(
  action: SQDIndexerResponses.Action,
): GeckoTerminalQueryResponses.JoinExitEvent {
  let asset0Decimals = action.asset0.decimals;
  let asset1Decimals = action.asset1.decimals;
  //decimalizing based on asset's decimals
  const decimalizedReserves0After = decimalize(
    action.reserves0After,
    asset0Decimals,
  );
  const decimalizedReserves1After = decimalize(
    action.reserves1After,
    asset1Decimals,
  );
  let _amount0: number | string;
  let _amount1: number | string;

  //calculating amount0
  if (action.amount0In && action.amount0In != "0") {
    _amount0 = action.amount0In;
  } else if (action.amount0Out && action.amount0Out != "0") {
    _amount0 = action.amount0Out;
  } else {
    throw new Error(`Invalid swap event data: ${JSON.stringify(action)}`);
  }

  // calculation amount1
  if (action.amount1In && action.amount1In != "0") {
    _amount1 = action.amount0In;
  } else if (action.amount1Out && action.amount1Out != "0") {
    _amount1 = action.amount1Out;
  } else {
    throw new Error(`Invalid swap event data: ${JSON.stringify(action)}`);
  }

  //decimalizing based on asset's decimals
  const decimalizedAmount0 = decimalize(_amount0, asset1Decimals);
  const decimalizedAmount1 = decimalize(_amount1, asset1Decimals);

  return {
    txnId: action.transaction,
    txnIndex: 0,
    eventIndex: 0,
    maker: action.pool.id,
    pairId: action.pool.id,
    reserves: {
      asset0: decimalizedReserves0After,
      asset1: decimalizedReserves1After,
    },
    /*********************************************
     * QUESTION 1:
     * Currently just hardcoding JOIN
     * How to handle JOIN and EXIT separately ,maybe with FUEL API (need to check)
     *********************************************/
    eventType: GeckoTerminalTypes.EventTypes.JOIN,
    amount0: decimalizedAmount0,
    amount1: decimalizedAmount1,
  };
}

function createEventDataForSwapEvent(
  action: SQDIndexerResponses.Action,
): GeckoTerminalQueryResponses.SwapEvent {
  let asset0Decimals = action.asset0.decimals;
  let asset1Decimals = action.asset1.decimals;

  const decimalizedReserves0After = decimalize(
    action.reserves0After,
    asset0Decimals,
  );
  const decimalizedReserves1After = decimalize(
    action.reserves1After,
    asset1Decimals,
  );
  let event = {
    txnId: action.transaction,
    txnIndex: 0,
    eventIndex: 0,
    maker: action.pool.id,
    pairId: action.pool.id,
    reserves: {
      asset0: decimalizedReserves0After,
      asset1: decimalizedReserves1After,
    },
    eventType: "swap",
    priceNative: parseFloat(action.amount0In) / parseFloat(action.amount1Out),
  } as GeckoTerminalQueryResponses.SwapEvent;

  // not adding "0" value to the output as per the Gecko Terminal spec( only one pair should be present at any given)
  if (
    action.amount0In &&
    action.amount0In != "0" &&
    action.amount1Out &&
    action.amount1Out != "0"
  ) {
    event = {
      ...event,
      asset0In: decimalize(action.amount0In, asset0Decimals),
      asset1Out: decimalize(action.amount1Out, asset1Decimals),
    };
  } else if (
    action.amount1In &&
    action.amount1In != "0" &&
    action.amount0Out &&
    action.amount0Out != "0"
  ) {
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
