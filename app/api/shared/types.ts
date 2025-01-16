// api/types/index.ts

import {GeckoTerminalTypes, SQDIndexerTypes} from "./constants";

// SQDIndexer responses
export namespace SQDIndexerResponses {
  // used to get block number of latest block
  export interface SquidStatus {
    height: number;
  }

  export interface Pool {
    id: string;
  }

  export interface Action {
    pool: Pool;
    asset0: {
      id: string;
      decimals: number;
    };
    asset1: {
      id: string;
      decimals: number;
    };
    amount1Out: string;
    amount1In: string;
    amount0Out: string;
    amount0In: string;
    reserves0After: string;
    reserves1After: string;
    type:
      | SQDIndexerTypes.ActionTypes.SWAP
      | SQDIndexerTypes.ActionTypes.JOIN_EXIT;
    transaction: string;
    timestamp: number;
    blockNumber: number;
  }

  // events api response (have to move to Fuel API asap)
  export interface Actions {
    actions: Array<Action>;
  }
}

// Fuel API responses
export namespace FuelAPIResponses {
  // used to get timestamp for a given block number
  export interface BlockByHeight {
    header: {
      time: number; // Unix timestamp in nanoseconds
    };
  }
}

// Types used by Gecko Terminal for queries
export namespace GeckoTerminalQueryResponses {
  export interface Block {
    blockNumber: number;
    blockTimestamp: number;
    metadata?: Record<string, string>;
  }

  // following interfaces are used for events api
  export interface Reserves {
    asset0: number | string;
    asset1: number | string;
  }

  export interface JoinExitEvent {
    eventType:
      | GeckoTerminalTypes.EventTypes.JOIN
      | GeckoTerminalTypes.EventTypes.EXIT;
    txnId: string;
    txnIndex: number;
    eventIndex: number;
    maker: string;
    pairId: string;
    amount0: number | string;
    amount1: number | string;
    reserves: Reserves;
    metadata?: Record<string, string>;
  }

  // export interface SwapEvent {
  //   eventType: "swap";
  //   txnId: string;
  //   txnIndex: number;
  //   eventIndex: number;
  //   maker: string;
  //   pairId: string;
  //   asset0In?: number | string;
  //   asset1In?: number | string;
  //   asset0Out?: number | string;
  //   asset1Out?: number | string;
  //   priceNative: number;
  //   reserves: Reserves;
  //   metadata?: Record<string, string>;
  // }

  export type SwapEvent = {
    eventType: "swap";
    txnId: string;
    txnIndex: number;
    eventIndex: number;
    maker: string;
    pairId: string;
    priceNative: number;
    reserves: Reserves;
    metadata?: Record<string, string>;
  } & (
    | {
        // Case 1: asset0In and asset1Out are present
        asset0In: number | string;
        asset1Out: number | string;
      }
    | {
        // Case 2: asset1In and asset0Out are present
        asset1In: number | string;
        asset0Out: number | string;
      }
  );

  export interface EventsResponse {
    events: Array<{block: Block} & (SwapEvent | JoinExitEvent)>;
  }

  interface FetchEventsParams {
    fromBlock: number;
    toBlock: number;
  }
}
