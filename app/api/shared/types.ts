import {GeckoTerminalTypes, SQDIndexerTypes} from "./constants";

// SQDIndexer responses
export namespace SQDIndexerResponses {
  // used to get block number of latest block
  export interface SquidStatus {
    finalizedHeight: number;
  }

  export interface Pool {
    id: string;
    asset0: Asset;
    asset1: Asset;
    feesUSD: string;
    asset0Id: string;
    asset1Id: string;
    creationBlock: number;
    creationTime: number;
    creationTx: string;
    creator?: string;
    feeBps?: number;
    pool?: {
      id: string;
      name: string;
      assetIds: string[];
      pairIds: string[];
      metadata?: Record<string, string>;
    };
    metadata?: Record<string, string>;
  }

  export interface Action {
    pool: Pool;
    asset0: {
      id: string;
      decimals: number;
      price: string;
    };
    asset1: {
      id: string;
      decimals: number;
      price: string;
    };
    amount1Out: string;
    amount1In: string;
    amount0Out: string;
    amount0In: string;
    reserves0After: string;
    reserves1After: string;
    type:
      | SQDIndexerTypes.ActionTypes.SWAP
      | SQDIndexerTypes.ActionTypes.JOIN
      | SQDIndexerTypes.ActionTypes.EXIT;
    transaction: string;
    timestamp: number;
    blockNumber: number;
  }

  // events api response (have to move to Fuel API asap)
  export interface Actions {
    actions: Array<Action>;
  }

  // following models are used for querying pair/pool data
  export interface Asset {
    id: string;
    l1Address: string;
    name: string;
    symbol: string;
    decimals: number;
    supply: string | number;
    circulatingSupply?: string | number;
    coinGeckoId?: string;
    coinMarketCapId?: string;
    metadata?: Record<string, string>;
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

  export type SwapEvent = {
    eventType: "swap";
    txnId: string;
    txnIndex: number;
    eventIndex: number;
    maker: string;
    pairId: string;
    priceNative: number | string;
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

  interface FetchEventsParams {
    fromBlock: number;
    toBlock: number;
  }

  export interface Pair {
    readonly id: string;
    readonly dexKey: string;
    readonly asset0Id: string;
    readonly asset1Id: string;
    readonly createdAtBlockNumber: number;
    readonly createdAtBlockTimestamp: number;
    readonly createdAtTxnId: string;
    readonly creator?: string;
    readonly feeBps?: number;
    readonly pool?: {
      readonly id: string;
      readonly name: string;
      readonly assetIds: string[];
      readonly pairIds: string[];
      readonly metadata?: Record<string, string>;
    };
    readonly metadata?: Record<string, string>;
  }

  export interface Asset {
    id: string;
    name: string;
    symbol: string;
    decimals: number;
    totalSupply?: string | number;
    circulatingSupply?: string | number;
    coinGeckoId?: string;
    coinMarketCapId?: string;
    metadata?: Record<string, string>;
  }

  export interface LatestBlockResponse {
    block: Block;
  }

  export interface AssetResponse {
    asset: Asset;
  }

  export interface EventsResponse {
    events: Array<{block: Block} & (SwapEvent | JoinExitEvent)>;
  }

  export interface PairResponse {
    pair: Pair;
  }
}
