/**
 * @api {get} /events Get all available events from one block to another (including all in between)
 */
import {NextRequest, NextResponse} from "next/server";
import {request, gql} from "graphql-request";
import {SQDIndexerUrl} from "@/src/utils/constants";
import {
  GeckoTerminalQueryResponses,
  SQDIndexerResponses,
} from "../shared/types";
import {GeckoTerminalTypes, SQDIndexerTypes} from "../shared/constants";
import {formatUnits} from "fuels";

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
        recipient
        timestamp
        blockNumber
      }
    }
  `;

  try {
    // Send the GraphQL request to fetch actions
    const actionsData = await request<SQDIndexerResponses.Actions>({
      url: SQDIndexerUrl,
      document: query,
      variables: {fromBlock, toBlock},
    });

    return actionsData;
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
  actionType:
    | SQDIndexerTypes.ActionTypes.JOIN
    | SQDIndexerTypes.ActionTypes.EXIT,
): GeckoTerminalQueryResponses.JoinExitEvent {
  const asset0Decimals = action.asset0.decimals;
  const asset1Decimals = action.asset1.decimals;
  //decimalizing based on asset's decimals

  const decimalizedReserves0After = formatUnits(
    action.reserves0After,
    asset0Decimals,
  );
  const decimalizedReserves1After = formatUnits(
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
    _amount1 = action.amount1In;
  } else if (action.amount1Out && action.amount1Out != "0") {
    _amount1 = action.amount1Out;
  } else {
    throw new Error(`Invalid swap event data: ${JSON.stringify(action)}`);
  }

  //decimalizing based on asset's decimals
  const decimalizedAmount0 = formatUnits(_amount0, asset0Decimals);
  const decimalizedAmount1 = formatUnits(_amount1, asset1Decimals);

  const eventType =
    actionType == SQDIndexerTypes.ActionTypes.JOIN
      ? GeckoTerminalTypes.EventTypes.JOIN
      : GeckoTerminalTypes.EventTypes.EXIT;

  return {
    eventType: eventType,
    txnId: action.transaction,
    txnIndex: 0,
    eventIndex: 0,
    maker: action.recipient,
    pairId: action.pool.id,
    reserves: {
      asset0: decimalizedReserves0After,
      asset1: decimalizedReserves1After,
    },
    amount0: decimalizedAmount0,
    amount1: decimalizedAmount1,
  };
}

function createEventDataForSwapEvent(
  action: SQDIndexerResponses.Action,
): GeckoTerminalQueryResponses.SwapEvent {
  const asset0Decimals = action.asset0.decimals;
  const asset1Decimals = action.asset1.decimals;

  const decimalizedReserves0After = formatUnits(
    action.reserves0After,
    asset0Decimals,
  );
  const decimalizedReserves1After = formatUnits(
    action.reserves1After,
    asset1Decimals,
  );
  let event = {
    eventType: "swap",
    txnId: action.transaction,
    txnIndex: 0,
    eventIndex: 0,
    maker: action.recipient,
    pairId: action.pool.id,
    reserves: {
      asset0: decimalizedReserves0After,
      asset1: decimalizedReserves1After,
    },
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
      asset0In: formatUnits(action.amount0In, asset0Decimals),
      asset1Out: formatUnits(action.amount1Out, asset1Decimals),
      priceNative:
        parseFloat(formatUnits(action.amount0In, asset0Decimals)) /
        parseFloat(formatUnits(action.amount1Out, asset1Decimals)),
    };
  } else if (
    action.amount1In &&
    action.amount1In != "0" &&
    action.amount0Out &&
    action.amount0Out != "0"
  ) {
    event = {
      ...event,
      asset1In: formatUnits(action.amount1In, asset1Decimals),
      asset0Out: formatUnits(action.amount0Out, asset0Decimals),
      priceNative:
        parseFloat(formatUnits(action.amount1In, asset1Decimals)) /
        parseFloat(formatUnits(action.amount0Out, asset0Decimals)),
    };
  } else {
    throw new Error(`Invalid swap event data: ${JSON.stringify(action)}`);
  }
  return event;
}

// Handle GET requests for /api/events
export async function GET(req: NextRequest) {
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
    const actionsData = await fetchEventsForBlockRange({fromBlock, toBlock});
    // If no actions are found, return empty events list
    if (actionsData.actions.length === 0) {
      return NextResponse.json({events: []});
    }

    // Process the fetched events and map them to the expected format
    const events = actionsData.actions
      .map((action: SQDIndexerResponses.Action) => {
        // Create block from actions object
        const block: GeckoTerminalQueryResponses.Block = {
          blockNumber: action.blockNumber,
          blockTimestamp: action.timestamp,
        };

        // Identify event type
        const isJoinExitEvent =
          action.type === SQDIndexerTypes.ActionTypes.JOIN ||
          action.type === SQDIndexerTypes.ActionTypes.EXIT;
        const isSwapEvent = action.type === SQDIndexerTypes.ActionTypes.SWAP;
        let eventData:
          | GeckoTerminalQueryResponses.JoinExitEvent
          | GeckoTerminalQueryResponses.SwapEvent
          | null = null;
        // Extracting necessary data from action and creating respective event(join/swap)
        if (isJoinExitEvent) {
          eventData = createEventDataForJoinExitEvent(
            action,
            action.type as
              | SQDIndexerTypes.ActionTypes.JOIN
              | SQDIndexerTypes.ActionTypes.EXIT,
          );
        } else if (isSwapEvent) {
          eventData = createEventDataForSwapEvent(action);
        }

        // Return null when eventData is not created
        if (!eventData) {
          console.warn(`Unknown event type: ${action.type}. Possible reasons: 
              1. Malformed data (e.g., missing properties: ${JSON.stringify(action)}) 
              2. Unexpected event type (action.type is not 'JOIN or EXIT' or 'SWAP')
              3. Issue with event creation functions.`);
          return null;
        }

        return {
          block,
          ...eventData,
        };
      })
      // filtering out null items in the events list
      .filter((event): event is Exclude<typeof event, null> => event !== null);

    const eventsResponse: GeckoTerminalQueryResponses.EventsResponse = {
      events,
    };

    // Return the formatted events data
    return NextResponse.json(eventsResponse);
  } catch (error) {
    console.error("Error fetching events:", error);
    return NextResponse.json(
      {error: "Failed to fetch events data"},
      {status: 500},
    );
  }
}
