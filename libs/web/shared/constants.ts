export namespace SQDIndexerTypes {
  export enum ActionTypes {
    JOIN = "ADD_LIQUIDITY",
    JOIN_V2 = "ADD_LIQUIDITY_V2",
    EXIT = "REMOVE_LIQUIDITY",
    EXIT_V2 = "REMOVE_LIQUIDITY_V2",
    SWAP = "SWAP",
    SWAP_V2 = "SWAP_V2",
  }
}

export namespace GeckoTerminalTypes {
  export enum EventTypes {
    JOIN = "join",
    EXIT = "exit",
    SWAP = "swap",
  }
}
