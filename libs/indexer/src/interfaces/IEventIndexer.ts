import {
  Event,
  Transaction,
  BlockInfo,
  Action,
  SwapEvent,
  LiquidityEvent,
  EventParams,
} from "../types";

export interface IEventIndexer {
  getEvents(params: EventParams): Promise<Event[]>;

  getTransactions(address: string, limit?: number): Promise<Transaction[]>;

  getLatestBlock(): Promise<BlockInfo>;

  getBlockByNumber(blockNumber: number): Promise<BlockInfo>;

  getActions(fromBlock: number, toBlock: number): Promise<Action[]>;

  getSwaps(poolId?: string, limit?: number): Promise<SwapEvent[]>;

  getLiquidityEvents(
    poolId?: string,
    limit?: number
  ): Promise<LiquidityEvent[]>;

  getSquidStatus(): Promise<{
    finalizedHeight: number;
    timestamp: number;
  }>;
}
