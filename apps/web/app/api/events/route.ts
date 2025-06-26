import { NextRequest, NextResponse } from "next/server";
/**
 * @api {get} /events Get all available events from one block to another (including all in between)
 */
import { request, gql } from "graphql-request";
import { SQDIndexerUrl } from "../../../../../libs/web/src/utils/constants";
import {
  GeckoTerminalQueryResponses,
  SQDIndexerResponses,
} from "@/web/shared/types";
import {
  GeckoTerminalTypes,
  SQDIndexerTypes,
} from "../../../../../libs/web/shared/constants";
import { formatUnits } from "fuels";

const MAX_BLOCK_RANGE = 5000;

const ACTIONS_QUERY = gql`
  query GetActions($fromBlock: Int!, $toBlock: Int!) {
    actions(where: { blockNumber_gt: $fromBlock, blockNumber_lt: $toBlock }) {
      pool { id }
      asset0 { id decimals }
      asset1 { id decimals }
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
    variables: { fromBlock, toBlock },
  });
}

function formatAmount(value: string, decimals: number): string {
  return formatUnits(value || "0", decimals);
}

function createEventData(action: SQDIndexerResponses.Action):
  | (GeckoTerminalQueryResponses.SwapEvent | GeckoTerminalQueryResponses.JoinExitEvent & { block: GeckoTerminalQueryResponses.Block })
  | null {

  const { asset0, asset1, pool, type, blockNumber, timestamp, transaction, recipient } = action;
  const block = { blockNumber, blockTimestamp: timestamp };

  const reserves = {
    asset0: formatAmount(action.reserves0After, asset0.decimals),
    asset1: formatAmount(action.reserves1After, asset1.decimals),
  };

  if (type === SQDIndexerTypes.ActionTypes.SWAP) {
    const amount0In = action.amount0In;
    const amount1Out = action.amount1Out;
    const amount1In = action.amount1In;
    const amount0Out = action.amount0Out;

    const eventBase = {
      eventType: "swap" as const,
      txnId: transaction,
      txnIndex: 0,
      eventIndex: 0,
      maker: recipient,
      pairId: pool.id,
      reserves,
      block,
    };

    if (amount0In && amount1Out) {
      const formatted0In = formatAmount(amount0In, asset0.decimals);
      const formatted1Out = formatAmount(amount1Out, asset1.decimals);
      return {
        ...eventBase,
        asset0In: formatted0In,
        asset1Out: formatted1Out,
        priceNative: parseFloat(formatted0In) / parseFloat(formatted1Out),
      };
    }

    if (amount1In && amount0Out) {
      const formatted1In = formatAmount(amount1In, asset1.decimals);
      const formatted0Out = formatAmount(amount0Out, asset0.decimals);
      return {
        ...eventBase,
        asset1In: formatted1In,
        asset0Out: formatted0Out,
        priceNative: parseFloat(formatted1In) / parseFloat(formatted0Out),
      };
    }

    return null;
  }

  if (type === SQDIndexerTypes.ActionTypes.JOIN || type === SQDIndexerTypes.ActionTypes.EXIT) {
    const amount0 = action.amount0In || action.amount0Out;
    const amount1 = action.amount1In || action.amount1Out;

    if (!amount0 || !amount1) return null;

    return {
      eventType:
        type === SQDIndexerTypes.ActionTypes.JOIN
          ? GeckoTerminalTypes.EventTypes.JOIN
          : GeckoTerminalTypes.EventTypes.EXIT,
      txnId: transaction,
      txnIndex: 0,
      eventIndex: 0,
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

    if (!fromBlock || !toBlock || fromBlock >= toBlock) {
      return NextResponse.json({ error: "'fromBlock' and 'toBlock' must be valid and ordered" }, { status: 400 });
    }

    const events: GeckoTerminalQueryResponses.Event[] = [];

    for (let start = fromBlock; start < toBlock; start += MAX_BLOCK_RANGE) {
      const end = Math.min(start + MAX_BLOCK_RANGE, toBlock);
      const { actions } = await fetchActions(start, end);

      for (const action of actions) {
        const eventData = createEventData(action);
        if (eventData) {
          const { block, ...rest } = eventData;
          events.push({ ...rest, block });
        }
      }
    }

    return NextResponse.json({ events });
  } catch (error) {
    console.error("Error fetching events:", error);
    return NextResponse.json({ error: "Failed to fetch events data" }, { status: 500 });
  }
}
