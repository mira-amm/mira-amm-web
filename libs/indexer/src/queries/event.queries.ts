import {gql} from "graphql-request";

export const GET_ACTIONS = gql`
  query GetActions($fromBlock: Int!, $toBlock: Int!) {
    actions(where: {blockNumber_gt: $fromBlock, blockNumber_lt: $toBlock}) {
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

export const GET_LATEST_BLOCK = gql`
  query GetLatestBlock {
    blocks(orderBy: timestamp_DESC, limit: 1) {
      timestamp
    }
  }
`;

export const GET_SQUID_STATUS = gql`
  query GetSquidStatus {
    squidStatus {
      height
    }
  }
`;

export const GET_WALLET_TRANSACTIONS = gql`
  query GetWalletTransactions($address: String!, $limit: Int = 50) {
    actions(
      where: {recipient: $address}
      orderBy: timestamp_DESC
      limit: $limit
    ) {
      id
      type
      transaction
      timestamp
      blockNumber
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
      amount0Out
      amount1In
      amount1Out
      reserves0After
      reserves1After
      recipient
    }
  }
`;

export const GET_SWAPS = gql`
  query GetSwaps($poolId: String, $limit: Int = 100) {
    actions(
      where: {type: SWAP, pool: {id_eq: $poolId}}
      orderBy: timestamp_DESC
      limit: $limit
    ) {
      id
      transaction
      timestamp
      blockNumber
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
      amount0In
      amount0Out
      amount1In
      amount1Out
      reserves0After
      reserves1After
      recipient
    }
  }
`;

export const GET_LIQUIDITY_EVENTS = gql`
  query GetLiquidityEvents($poolId: String, $limit: Int = 100) {
    actions(
      where: {type_in: [JOIN, EXIT], pool: {id_eq: $poolId}}
      orderBy: timestamp_DESC
      limit: $limit
    ) {
      id
      type
      transaction
      timestamp
      blockNumber
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
      amount0In
      amount0Out
      amount1In
      amount1Out
      reserves0After
      reserves1After
      recipient
    }
  }
`;
