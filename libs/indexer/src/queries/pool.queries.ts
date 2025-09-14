import {gql} from "graphql-request";

export const GET_POOL_BY_ID = gql`
  query GetPoolById($id: String!) {
    poolById(id: $id) {
      id
      asset0 {
        id
      }
      asset1 {
        id
      }
      creationBlock
      creationTime
      creationTx
    }
  }
`;

export const GET_POOLS_CONNECTION = gql`
  query PoolsConnection(
    $first: Int!
    $after: String
    $orderBy: [PoolOrderByInput!]!
    $poolWhereInput: PoolWhereInput
  ) {
    poolsConnection(
      first: $first
      after: $after
      orderBy: $orderBy
      where: $poolWhereInput
    ) {
      totalCount
      edges {
        node {
          id
          reserve0Decimal
          reserve1Decimal
          tvlUSD
          asset1 {
            id
            symbol
          }
          asset0 {
            id
            symbol
          }
          snapshots(where: {timestamp_gt: $timestamp24hAgo}) {
            volumeUSD
            feesUSD
          }
        }
      }
    }
  }
`;

export const GET_POOLS_WITH_RESERVES = gql`
  query GetPoolsWithReserves($poolIds: [String!]) {
    pools(where: {id_in: $poolIds}, orderBy: tvlUSD_DESC) {
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
      reserve0
      reserve1
      reserve0Decimal
      reserve1Decimal
      tvlUSD
      volumeUSD
      creationBlock
      creationTime
      creationTx
    }
  }
`;

export const GET_USER_POSITIONS = gql`
  query GetUserPositions($userAddress: String!) {
    positions(where: {user: $userAddress}) {
      id
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
      liquidity
      user
      createdAt
      updatedAt
    }
  }
`;

export const GET_POOL_APR = gql`
  query GetPoolAPR($poolId: String!, $timestamp24h: Int!) {
    pool: poolById(id: $poolId) {
      id
      tvlUSD
      snapshots(where: {timestamp_gt: $timestamp24h}) {
        feesUSD
        volumeUSD
      }
    }
  }
`;
