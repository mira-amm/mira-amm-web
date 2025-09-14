import {gql} from "graphql-request";

export const PROTOCOL_STATS_QUERY = gql`
  query GetProtocolStats($timestamp24h: Int, $timestamp7d: Int) {
    pools(orderBy: tvlUSD_DESC) {
      poolTVL: tvlUSD
      poolAlltimeVolume: volumeUSD
      snapshot24hours: snapshots(where: {timestamp_gt: $timestamp24h}) {
        poolHourVolume: volumeUSD
      }
      snapshot7days: snapshots(where: {timestamp_gt: $timestamp7d}) {
        poolHourVolume: volumeUSD
      }
    }
  }
`;

export const BASIC_PROTOCOL_STATS_QUERY = gql`
  query GetBasicProtocolStats {
    pools(orderBy: tvlUSD_DESC) {
      poolTVL: tvlUSD
      poolAlltimeVolume: volumeUSD
    }
  }
`;

export const GET_POOL_VOLUME = gql`
  query GetPoolVolume($poolId: String!, $fromTimestamp: Int!) {
    pool: poolById(id: $poolId) {
      snapshots(where: {timestamp_gt: $fromTimestamp}) {
        volumeUSD
        timestamp
      }
    }
  }
`;

export const GET_POOL_TVL = gql`
  query GetPoolTVL($poolId: String!) {
    pool: poolById(id: $poolId) {
      tvlUSD
    }
  }
`;

export const GET_HISTORICAL_DATA = gql`
  query GetHistoricalData(
    $poolId: String
    $fromTimestamp: Int!
    $toTimestamp: Int!
  ) {
    snapshots(
      where: {
        pool: {id_eq: $poolId}
        timestamp_gte: $fromTimestamp
        timestamp_lte: $toTimestamp
      }
      orderBy: timestamp_ASC
    ) {
      timestamp
      tvlUSD
      volumeUSD
      feesUSD
    }
  }
`;

export const GET_PROTOCOL_FEES = gql`
  query GetProtocolFees($fromTimestamp: Int!) {
    pools {
      id
      snapshots(where: {timestamp_gt: $fromTimestamp}) {
        feesUSD
      }
    }
  }
`;
