import {IEventIndexer} from "../interfaces";
import {
  Event,
  Transaction,
  BlockInfo,
  Action,
  SwapEvent,
  LiquidityEvent,
  EventParams,
  ActionType,
  EventType,
} from "../types";
import {
  GET_ACTIONS,
  GET_LATEST_BLOCK,
  GET_SQUID_STATUS,
  GET_WALLET_TRANSACTIONS,
  GET_SWAPS,
  GET_LIQUIDITY_EVENTS,
} from "../queries";

export class EventIndexer implements IEventIndexer {
  constructor(
    private indexer: {query: <T>(query: string, variables?: any) => Promise<T>}
  ) {}

  async getEvents(params: EventParams): Promise<Event[]> {
    // Convert actions to events
    const actions = await this.getActions(
      params.fromBlock || 0,
      params.toBlock || 999999999
    );

    return actions.map((action) => this.transformActionToEvent(action));
  }

  async getTransactions(address: string, limit = 50): Promise<Transaction[]> {
    const response = await this.indexer.query<{actions: any[]}>(
      GET_WALLET_TRANSACTIONS,
      {address, limit}
    );

    return response.actions.map((action) =>
      this.transformActionToTransaction(action)
    );
  }

  async getLatestBlock(): Promise<BlockInfo> {
    const response = await this.indexer.query<{
      blocks: {timestamp: number}[];
    }>(GET_LATEST_BLOCK);

    if (!response.blocks || response.blocks.length === 0) {
      throw new Error("No blocks found");
    }

    const latestBlock = response.blocks[0];
    return {
      blockNumber: 0, // Would need to be included in the query
      blockTimestamp: latestBlock.timestamp,
    };
  }

  async getBlockByNumber(blockNumber: number): Promise<BlockInfo> {
    // This would need a specific query for block by number
    // For now, return a placeholder
    return {
      blockNumber,
      blockTimestamp: Date.now(),
    };
  }

  async getActions(fromBlock: number, toBlock: number): Promise<Action[]> {
    const response = await this.indexer.query<{actions: any[]}>(GET_ACTIONS, {
      fromBlock,
      toBlock,
    });

    return response.actions.map((action) => this.transformActionData(action));
  }

  async getSwaps(poolId?: string, limit = 100): Promise<SwapEvent[]> {
    const response = await this.indexer.query<{actions: any[]}>(GET_SWAPS, {
      poolId,
      limit,
    });

    return response.actions
      .filter((action) => action.type === "SWAP")
      .map((action) => this.transformActionToSwapEvent(action));
  }

  async getLiquidityEvents(
    poolId?: string,
    limit = 100
  ): Promise<LiquidityEvent[]> {
    const response = await this.indexer.query<{actions: any[]}>(
      GET_LIQUIDITY_EVENTS,
      {poolId, limit}
    );

    return response.actions
      .filter((action) => ["JOIN", "EXIT"].includes(action.type))
      .map((action) => this.transformActionToLiquidityEvent(action));
  }

  async getSquidStatus() {
    try {
      const response = await this.indexer.query<{
        squidStatus: {height: number};
      }>(GET_SQUID_STATUS);

      return {
        finalizedHeight: response.squidStatus.height,
        timestamp: Date.now(),
      };
    } catch (error) {
      // Fallback if squidStatus query doesn't exist
      return {
        finalizedHeight: 1000000,
        timestamp: Date.now(),
      };
    }
  }

  private transformActionData(actionData: any): Action {
    return {
      pool: actionData.pool,
      recipient: actionData.recipient,
      asset0: actionData.asset0,
      asset1: actionData.asset1,
      amount0In: actionData.amount0In,
      amount0Out: actionData.amount0Out,
      amount1In: actionData.amount1In,
      amount1Out: actionData.amount1Out,
      reserves0After: actionData.reserves0After,
      reserves1After: actionData.reserves1After,
      type: actionData.type as ActionType,
      transaction: actionData.transaction,
      timestamp: actionData.timestamp,
      blockNumber: actionData.blockNumber,
    };
  }

  private transformActionToEvent(action: Action): Event {
    return {
      eventType: this.mapActionTypeToEventType(action.type),
      txnId: action.transaction,
      txnIndex: 0,
      eventIndex: 0,
      maker: action.recipient,
      pairId: action.pool.id,
      reserves: {
        asset0: action.reserves0After,
        asset1: action.reserves1After,
      },
      block: {
        blockNumber: action.blockNumber,
        blockTimestamp: action.timestamp,
      },
    };
  }

  private transformActionToSwapEvent(action: any): SwapEvent {
    const baseEvent = this.transformActionToEvent(action);

    // Determine swap direction and amounts
    let swapData: any = {
      priceNative: 0,
    };

    if (action.amount0In && action.amount1Out) {
      const amount0In =
        parseFloat(action.amount0In) / Math.pow(10, action.asset0.decimals);
      const amount1Out =
        parseFloat(action.amount1Out) / Math.pow(10, action.asset1.decimals);

      swapData = {
        asset0In: amount0In,
        asset1Out: amount1Out,
        priceNative: amount0In / amount1Out,
      };
    } else if (action.amount1In && action.amount0Out) {
      const amount1In =
        parseFloat(action.amount1In) / Math.pow(10, action.asset1.decimals);
      const amount0Out =
        parseFloat(action.amount0Out) / Math.pow(10, action.asset0.decimals);

      swapData = {
        asset1In: amount1In,
        asset0Out: amount0Out,
        priceNative: amount1In / amount0Out,
      };
    }

    return {
      ...baseEvent,
      eventType: EventType.SWAP,
      ...swapData,
    };
  }

  private transformActionToLiquidityEvent(action: any): LiquidityEvent {
    const baseEvent = this.transformActionToEvent(action);

    const amount0 = action.amount0In || action.amount0Out;
    const amount1 = action.amount1In || action.amount1Out;

    return {
      ...baseEvent,
      eventType: action.type === "JOIN" ? EventType.JOIN : EventType.EXIT,
      amount0:
        parseFloat(amount0 || "0") / Math.pow(10, action.asset0.decimals),
      amount1:
        parseFloat(amount1 || "0") / Math.pow(10, action.asset1.decimals),
    };
  }

  private transformActionToTransaction(action: any): Transaction {
    return {
      id: action.id,
      hash: action.transaction,
      from: action.recipient,
      blockNumber: action.blockNumber,
      timestamp: action.timestamp,
      type: action.type,
      status: "success" as const,
      data: {
        pool: action.pool,
        amounts: {
          amount0In: action.amount0In,
          amount0Out: action.amount0Out,
          amount1In: action.amount1In,
          amount1Out: action.amount1Out,
        },
      },
    };
  }

  private mapActionTypeToEventType(actionType: ActionType): EventType {
    switch (actionType) {
      case ActionType.SWAP:
        return EventType.SWAP;
      case ActionType.JOIN:
        return EventType.JOIN;
      case ActionType.EXIT:
        return EventType.EXIT;
      default:
        return EventType.SWAP;
    }
  }
}
