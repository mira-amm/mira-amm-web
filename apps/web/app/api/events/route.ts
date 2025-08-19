import {NextRequest, NextResponse} from "next/server";
/**
 * @api {get} /events Get all available events from one block to another (including all in between)
 */
import {request, gql} from "graphql-request";
import {SQDIndexerUrl} from "../../../../../libs/web/src/utils/constants";
import {
  GeckoTerminalQueryResponses,
  SQDIndexerResponses,
  BinnedAmounts,
  BinnedLiquidityMetadata,
} from "@/web/shared/types";
import {
  GeckoTerminalTypes,
  SQDIndexerTypes,
} from "../../../../../libs/web/shared/constants";
import {formatUnits} from "fuels";

const MAX_BLOCK_RANGE = 5000;

const ACTIONS_QUERY = gql`
  query GetActions($fromBlock: Int!, $toBlock: Int!) {
    actions(where: {blockNumber_gt: $fromBlock, blockNumber_lt: $toBlock}) {
      pool {
        id
        binStep
        activeId
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
      # Binned liquidity specific fields
      binId
      amountsIn {
        x
        y
      }
      amountsOut {
        x
        y
      }
      totalFees {
        x
        y
      }
      protocolFees {
        x
        y
      }
      sender
      to
      binIds
      amounts {
        x
        y
      }
      amountsWithdrawn {
        x
        y
      }
      lpTokenMinted
      lpTokenBurned
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

function formatAmount(value: string, decimals: number): string {
  return formatUnits(value || "0", decimals);
}

// Helper function to detect if this is a binned liquidity event
function isBinnedLiquidityEvent(action: SQDIndexerResponses.Action): boolean {
  return !!(
    action.binId !== undefined ||
    action.amountsIn ||
    action.amountsOut ||
    action.totalFees ||
    action.protocolFees ||
    action.binIds ||
    action.amounts ||
    action.lpTokenMinted ||
    action.lpTokenBurned
  );
}

// Helper function to create binned liquidity metadata
function createBinnedMetadata(action: SQDIndexerResponses.Action): BinnedLiquidityMetadata | undefined {
  if (!isBinnedLiquidityEvent(action)) return undefined;

  return {
    binId: action.binId,
    binStep: action.pool.binStep,
    activeId: action.pool.activeId,
    lpTokenMinted: action.lpTokenMinted,
    lpTokenBurned: action.lpTokenBurned,
    totalFees: action.totalFees,
    protocolFees: action.protocolFees,
  };
}

// Helper function to format binned amounts to traditional amounts
function formatBinnedToTraditional(
  amountsIn?: BinnedAmounts,
  amountsOut?: BinnedAmounts,
  asset0Decimals?: number,
  asset1Decimals?: number
): {
  amount0In?: string;
  amount1In?: string;
  amount0Out?: string;
  amount1Out?: string;
} {
  return {
    amount0In: amountsIn?.x || "0",
    amount1In: amountsIn?.y || "0",
    amount0Out: amountsOut?.x || "0",
    amount1Out: amountsOut?.y || "0",
  };
}

function createEventData(action: SQDIndexerResponses.Action):
  | (
      | GeckoTerminalQueryResponses.SwapEvent
      | (GeckoTerminalQueryResponses.JoinExitEvent & {
          block: GeckoTerminalQueryResponses.Block;
        })
      | (GeckoTerminalQueryResponses.BinnedLiquidityEvent & {
          block: GeckoTerminalQueryResponses.Block;
        })
    )
  | null {
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

  const binnedMetadata = createBinnedMetadata(action);
  const isBinned = isBinnedLiquidityEvent(action);

  if (type === SQDIndexerTypes.ActionTypes.SWAP) {
    // Handle both traditional and binned liquidity swaps
    let amount0In, amount1In, amount0Out, amount1Out;

    if (isBinned && action.amountsIn && action.amountsOut) {
      // Binned liquidity: use amountsIn/amountsOut
      const traditional = formatBinnedToTraditional(
        action.amountsIn,
        action.amountsOut,
        asset0.decimals,
        asset1.decimals
      );
      amount0In = traditional.amount0In;
      amount1In = traditional.amount1In;
      amount0Out = traditional.amount0Out;
      amount1Out = traditional.amount1Out;
    } else {
      // Traditional AMM: use existing fields
      amount0In = action.amount0In;
      amount1Out = action.amount1Out;
      amount1In = action.amount1In;
      amount0Out = action.amount0Out;
    }

    const eventBase = {
      eventType: "swap" as const,
      txnId: transaction,
      txnIndex: 0,
      eventIndex: 0,
      maker: action.sender || recipient, // Use sender for binned liquidity, fallback to recipient
      pairId: pool.id,
      reserves,
      block,
      binnedMetadata,
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

  // Handle traditional JOIN/EXIT and new binned liquidity MINT/BURN events
  if (
    type === SQDIndexerTypes.ActionTypes.JOIN ||
    type === SQDIndexerTypes.ActionTypes.EXIT ||
    type === SQDIndexerTypes.ActionTypes.MINT_LIQUIDITY ||
    type === SQDIndexerTypes.ActionTypes.BURN_LIQUIDITY
  ) {
    let amount0, amount1, eventType;

    if (isBinned) {
      // For binned liquidity, aggregate amounts from all bins
      if (action.amounts && action.amounts.length > 0) {
        const totalAmounts = action.amounts.reduce(
          (acc, curr) => ({
            x: (BigInt(acc.x) + BigInt(curr.x || "0")).toString(),
            y: (BigInt(acc.y) + BigInt(curr.y || "0")).toString(),
          }),
          { x: "0", y: "0" }
        );
        amount0 = totalAmounts.x;
        amount1 = totalAmounts.y;
      } else if (action.amountsWithdrawn && action.amountsWithdrawn.length > 0) {
        const totalAmounts = action.amountsWithdrawn.reduce(
          (acc, curr) => ({
            x: (BigInt(acc.x) + BigInt(curr.x || "0")).toString(),
            y: (BigInt(acc.y) + BigInt(curr.y || "0")).toString(),
          }),
          { x: "0", y: "0" }
        );
        amount0 = totalAmounts.x;
        amount1 = totalAmounts.y;
      }

      // Map binned liquidity event types to GeckoTerminal types
      eventType =
        type === SQDIndexerTypes.ActionTypes.MINT_LIQUIDITY
          ? GeckoTerminalTypes.EventTypes.MINT_LIQUIDITY
          : GeckoTerminalTypes.EventTypes.BURN_LIQUIDITY;
    } else {
      // Traditional AMM
      amount0 = action.amount0In || action.amount0Out;
      amount1 = action.amount1In || action.amount1Out;
      eventType =
        type === SQDIndexerTypes.ActionTypes.JOIN
          ? GeckoTerminalTypes.EventTypes.JOIN
          : GeckoTerminalTypes.EventTypes.EXIT;
    }

    if (!amount0 || !amount1) return null;

    return {
      eventType,
      txnId: transaction,
      txnIndex: 0,
      eventIndex: 0,
      maker: action.sender || recipient,
      pairId: pool.id,
      amount0: formatAmount(amount0, asset0.decimals),
      amount1: formatAmount(amount1, asset1.decimals),
      reserves,
      block,
      binnedMetadata,
    };
  }

  // Handle new binned liquidity specific events
  if (
    type === SQDIndexerTypes.ActionTypes.COLLECT_PROTOCOL_FEES ||
    type === SQDIndexerTypes.ActionTypes.COMPOSITION_FEES
  ) {
    if (!binnedMetadata) return null;

    return {
      eventType:
        type === SQDIndexerTypes.ActionTypes.COLLECT_PROTOCOL_FEES
          ? GeckoTerminalTypes.EventTypes.COLLECT_PROTOCOL_FEES
          : GeckoTerminalTypes.EventTypes.COMPOSITION_FEES,
      txnId: transaction,
      txnIndex: 0,
      eventIndex: 0,
      maker: action.sender || recipient,
      pairId: pool.id,
      reserves,
      block,
      binnedMetadata,
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
      return NextResponse.json(
        {error: "'fromBlock' and 'toBlock' must be valid and ordered"},
        {status: 400}
      );
    }

    const events: GeckoTerminalQueryResponses.Event[] = [];

    for (let start = fromBlock; start < toBlock; start += MAX_BLOCK_RANGE) {
      const end = Math.min(start + MAX_BLOCK_RANGE, toBlock);
      const {actions} = await fetchActions(start, end);

      for (const action of actions) {
        const eventData = createEventData(action);
        if (eventData) {
          const {block, ...rest} = eventData;
          events.push({...rest, block});
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
