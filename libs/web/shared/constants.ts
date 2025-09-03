export namespace SQDIndexerTypes {
  export enum ActionTypes {
    // Traditional AMM events (backward compatibility)
    JOIN = "ADD_LIQUIDITY",
    EXIT = "REMOVE_LIQUIDITY",
    SWAP = "SWAP",
    // Binned liquidity events
    MINT_LIQUIDITY = "MINT_LIQUIDITY",
    BURN_LIQUIDITY = "BURN_LIQUIDITY",
    COLLECT_PROTOCOL_FEES = "COLLECT_PROTOCOL_FEES",
    COMPOSITION_FEES = "COMPOSITION_FEES",
  }
}

export namespace GeckoTerminalTypes {
  export enum EventTypes {
    // Traditional AMM events (backward compatibility)
    JOIN = "join",
    EXIT = "exit",
    SWAP = "swap",
    // Binned liquidity events
    MINT_LIQUIDITY = "mint_liquidity",
    BURN_LIQUIDITY = "burn_liquidity",
    COLLECT_PROTOCOL_FEES = "collect_protocol_fees",
    COMPOSITION_FEES = "composition_fees",
  }
}
