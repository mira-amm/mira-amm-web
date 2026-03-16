import {NextRequest, NextResponse} from "next/server";
/**
 * @api {get} /events Get all available events from one block to another (including all in between)
 */
import {request, gql} from "graphql-request";
import {SQDIndexerUrl} from "../../../../../libs/web/src/utils/constants";
import {
  GeckoTerminalQueryResponses,
  SQDIndexerResponses,
} from "@/web/shared/types";
import {
  GeckoTerminalTypes,
  SQDIndexerTypes,
} from "../../../../../libs/web/shared/constants";
import {formatUnits} from "fuels";

const MAX_BLOCK_RANGE = 5000;

type GeckoEvent = GeckoTerminalQueryResponses.EventsResponse["events"][number];

const ACTIONS_QUERY = gql`
  query GetActions($fromBlock: Int!, $toBlock: Int!) {
    actions(
      where: {blockNumber_gte: $fromBlock, blockNumber_lte: $toBlock}
      orderBy: [blockNumber_ASC, transaction_ASC, id_ASC]
    ) {
      id
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

async function fetchActions(fromBlock: number, toBlock: number) {
  return request<SQDIndexerResponses.Actions>({
    url: SQDIndexerUrl,
    document: ACTIONS_QUERY,
    variables: {fromBlock, toBlock},
  });
}

function isSwapType(type: SQDIndexerResponses.Action["type"]) {
  return (
    type === SQDIndexerTypes.ActionTypes.SWAP ||
    type === SQDIndexerTypes.ActionTypes.SWAP_V2
  );
}

function isJoinType(type: SQDIndexerResponses.Action["type"]) {
  return (
    type === SQDIndexerTypes.ActionTypes.JOIN ||
    type === SQDIndexerTypes.ActionTypes.JOIN_V2
  );
}

function isExitType(type: SQDIndexerResponses.Action["type"]) {
  return (
    type === SQDIndexerTypes.ActionTypes.EXIT ||
    type === SQDIndexerTypes.ActionTypes.EXIT_V2
  );
}

function formatAmount(value: string, decimals: number): string {
  return formatUnits(value || "0", decimals);
}

function createEventData(
  action: SQDIndexerResponses.Action,
  txnIndex: number,
  eventIndex: number
): GeckoEvent | null {
  const {
    asset0,
    asset1,
    pool,
    type,
    blockNumber,
    timestamp,
    transaction,
    recipient,
  } = action;
  const block = {blockNumber, blockTimestamp: timestamp};

  const reserves = {
    asset0: formatAmount(action.reserves0After, asset0.decimals),
    asset1: formatAmount(action.reserves1After, asset1.decimals),
  };

  if (isSwapType(type)) {
    const amount0In = action.amount0In;
    const amount1Out = action.amount1Out;
    const amount1In = action.amount1In;
    const amount0Out = action.amount0Out;

    const eventBase = {
      eventType: "swap" as const,
      txnId: transaction,
      txnIndex,
      eventIndex,
      maker: recipient,
      pairId: pool.id,
      reserves,
      block,
    };

    if (amount0In && amount1Out) {
      const formatted0In = formatAmount(amount0In, asset0.decimals);
      const formatted1Out = formatAmount(amount1Out, asset1.decimals);
      // priceNative = amount(asset1) / amount(asset0)
      return {
        ...eventBase,
        asset0In: formatted0In,
        asset1Out: formatted1Out,
        priceNative: parseFloat(formatted1Out) / parseFloat(formatted0In),
      };
    }

    if (amount1In && amount0Out) {
      const formatted1In = formatAmount(amount1In, asset1.decimals);
      const formatted0Out = formatAmount(amount0Out, asset0.decimals);
      // priceNative = amount(asset1) / amount(asset0)
      return {
        ...eventBase,
        asset1In: formatted1In,
        asset0Out: formatted0Out,
        priceNative: parseFloat(formatted1In) / parseFloat(formatted0Out),
      };
    }

    return null;
  }

  if (isJoinType(type) || isExitType(type)) {
    const amount0 = action.amount0In || action.amount0Out;
    const amount1 = action.amount1In || action.amount1Out;

    if (!amount0 || !amount1) return null;

    return {
      eventType: isJoinType(type)
        ? GeckoTerminalTypes.EventTypes.JOIN
        : GeckoTerminalTypes.EventTypes.EXIT,
      txnId: transaction,
      txnIndex,
      eventIndex,
      maker: recipient,
      pairId: pool.id,
      amount0: formatAmount(amount0, asset0.decimals),
      amount1: formatAmount(amount1, asset1.decimals),
      reserves,
      block,
    };
  }

  return null;
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const fromBlock = parseInt(url.searchParams.get("fromBlock") || "0", 10);
    const toBlock = parseInt(url.searchParams.get("toBlock") || "0", 10);

    if (!fromBlock || !toBlock || fromBlock > toBlock) {
      return NextResponse.json(
        {error: "'fromBlock' and 'toBlock' must be valid and ordered"},
        {status: 400}
      );
    }

    const events: GeckoEvent[] = [];

    for (let start = fromBlock; start <= toBlock; start += MAX_BLOCK_RANGE) {
      const end = Math.min(start + MAX_BLOCK_RANGE - 1, toBlock);
      const {actions} = await fetchActions(start, end);

      // Track transaction and event indices
      let currentBlock = 0;
      let currentTxn = "";
      let txnIndex = 0;
      let eventIndex = 0;

      for (const action of actions) {
        // Reset indices when we move to a new block
        if (action.blockNumber !== currentBlock) {
          currentBlock = action.blockNumber;
          currentTxn = "";
          txnIndex = 0;
          eventIndex = 0;
        }

        // Increment txnIndex when we encounter a new transaction
        if (action.transaction !== currentTxn) {
          if (currentTxn !== "") {
            txnIndex++;
          }
          currentTxn = action.transaction;
          eventIndex = 0;
        }

        const eventData = createEventData(action, txnIndex, eventIndex);
        if (eventData) {
          events.push(eventData);
          eventIndex++;
        }
      }
    }

    return NextResponse.json({events});
  } catch (error) {
    console.error("Error fetching events:", error);
    return NextResponse.json(
      {error: "Failed to fetch events data"},
      {status: 500}
    );
  }
}
