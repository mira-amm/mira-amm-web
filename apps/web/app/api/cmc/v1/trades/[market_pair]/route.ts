/**
 * CoinMarketCap Trades Endpoint v1
 * @api {get} /api/cmc/v1/trades/:market_pair Get recently completed trades for a given market pair
 *
 * Returns 24-hour historical trades as minimum requirement.
 */
import {NextRequest, NextResponse} from "next/server";
import {request, gql} from "graphql-request";
import {SQDIndexerUrl} from "@/web/src/utils/constants";

interface ActionData {
  id: string;
  blockNumber: number;
  timestamp: number;
  transaction: string;
  type: string;
  pool: {
    id: string;
    asset0: {
      id: string;
      symbol: string;
      decimals: number;
    };
    asset1: {
      id: string;
      symbol: string;
      decimals: number;
    };
  };
  amount0In: string;
  amount1In: string;
  amount0Out: string;
  amount1Out: string;
}

function formatAmount(value: string, decimals: number): string {
  if (!value || value === "0") return "0";
  const num = parseFloat(value) / Math.pow(10, decimals);
  return num.toString();
}

export async function GET(
  req: NextRequest,
  {params}: {params: Promise<{market_pair: string}>}
) {
  try {
    const marketPair = (await params).market_pair;

    // Parse market pair (e.g., "ETH_USDC")
    const [baseSymbol, quoteSymbol] = marketPair.split("_");
    if (!baseSymbol || !quoteSymbol) {
      return NextResponse.json(
        {error: "Invalid market pair format. Use BASE_QUOTE (e.g., ETH_USDC)"},
        {status: 400}
      );
    }

    // Calculate 24 hours ago timestamp
    const timestamp24hAgo = Math.floor(Date.now() / 1000) - 24 * 60 * 60;

    // Query to get swap actions for this trading pair in the last 24 hours
    const tradesQuery = gql`
      query GetTrades($base: String!, $quote: String!, $timestamp24h: Int!) {
        actions(
          where: {
            AND: [
              {OR: [{type_eq: SWAP}, {type_eq: SWAP_V2}]}
              {timestamp_gte: $timestamp24h}
              {
                OR: [
                  {
                    AND: [
                      {pool: {asset0: {symbol_eq: $base}}}
                      {pool: {asset1: {symbol_eq: $quote}}}
                    ]
                  }
                  {
                    AND: [
                      {pool: {asset0: {symbol_eq: $quote}}}
                      {pool: {asset1: {symbol_eq: $base}}}
                    ]
                  }
                ]
              }
            ]
          }
          orderBy: timestamp_DESC
          limit: 1000
        ) {
          id
          blockNumber
          timestamp
          transaction
          type
          pool {
            id
            asset0 {
              id
              symbol
              decimals
            }
            asset1 {
              id
              symbol
              decimals
            }
          }
          amount0In
          amount1In
          amount0Out
          amount1Out
        }
      }
    `;

    const {actions} = await request<{actions: ActionData[]}>({
      url: SQDIndexerUrl,
      document: tradesQuery,
      variables: {
        base: baseSymbol,
        quote: quoteSymbol,
        timestamp24h: timestamp24hAgo,
      },
    });

    if (!actions || actions.length === 0) {
      // Return empty array if no trades found
      return NextResponse.json([], {
        headers: {
          "Cache-Control": "public, max-age=60",
        },
      });
    }

    // Determine if we need to flip the pair
    const pool = actions[0].pool;
    const isFlipped = pool.asset0.symbol === quoteSymbol;

    // Transform to CoinMarketCap trades format
    const trades = actions.map((action) => {
      const {
        id,
        timestamp,
        transaction,
        amount0In,
        amount1In,
        amount0Out,
        amount1Out,
        pool,
      } = action;

      let price: number;
      let baseVolume: string;
      let quoteVolume: string;
      let type: "buy" | "sell";

      if (isFlipped) {
        // Pool is QUOTE_BASE but we need BASE_QUOTE
        // amount0 = quote asset, amount1 = base asset
        const amt0In = parseFloat(
          formatAmount(amount0In, pool.asset0.decimals)
        );
        const amt0Out = parseFloat(
          formatAmount(amount0Out, pool.asset0.decimals)
        );
        const amt1In = parseFloat(
          formatAmount(amount1In, pool.asset1.decimals)
        );
        const amt1Out = parseFloat(
          formatAmount(amount1Out, pool.asset1.decimals)
        );

        if (amt1In > 0 && amt0Out > 0) {
          // Selling base asset (asset1) for quote asset (asset0)
          price = amt0Out / amt1In;
          baseVolume = amt1In.toString();
          quoteVolume = amt0Out.toString();
          type = "sell";
        } else if (amt0In > 0 && amt1Out > 0) {
          // Buying base asset (asset1) with quote asset (asset0)
          price = amt0In / amt1Out;
          baseVolume = amt1Out.toString();
          quoteVolume = amt0In.toString();
          type = "buy";
        } else {
          // Fallback
          price = 0;
          baseVolume = "0";
          quoteVolume = "0";
          type = "buy";
        }
      } else {
        // Pool is BASE_QUOTE
        // amount0 = base asset, amount1 = quote asset
        const amt0In = parseFloat(
          formatAmount(amount0In, pool.asset0.decimals)
        );
        const amt0Out = parseFloat(
          formatAmount(amount0Out, pool.asset0.decimals)
        );
        const amt1In = parseFloat(
          formatAmount(amount1In, pool.asset1.decimals)
        );
        const amt1Out = parseFloat(
          formatAmount(amount1Out, pool.asset1.decimals)
        );

        if (amt0In > 0 && amt1Out > 0) {
          // Selling base asset (asset0) for quote asset (asset1)
          price = amt1Out / amt0In;
          baseVolume = amt0In.toString();
          quoteVolume = amt1Out.toString();
          type = "sell";
        } else if (amt1In > 0 && amt0Out > 0) {
          // Buying base asset (asset0) with quote asset (asset1)
          price = amt1In / amt0Out;
          baseVolume = amt0Out.toString();
          quoteVolume = amt1In.toString();
          type = "buy";
        } else {
          // Fallback
          price = 0;
          baseVolume = "0";
          quoteVolume = "0";
          type = "buy";
        }
      }

      return {
        trade_id: `${transaction}-${id}`,
        price: price.toString(),
        base_volume: baseVolume,
        quote_volume: quoteVolume,
        timestamp: timestamp * 1000, // Convert to milliseconds
        type,
      };
    });

    return NextResponse.json(trades, {
      headers: {
        "Cache-Control": "public, max-age=60",
      },
    });
  } catch (error) {
    console.error("Error fetching trades data:", error);
    return NextResponse.json(
      {error: "Failed to fetch trades data"},
      {status: 500}
    );
  }
}
