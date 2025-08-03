/**
 * GraphQL queries for protocol statistics
 * Fetches data from Subsquid endpoint for protocol-wide metrics
 */

/**
 * Main query to fetch all protocol statistics data
 * Includes TVL, all-time volume, and time-based volume snapshots
 */
export const PROTOCOL_STATS_QUERY = `
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

/**
 * Simplified query for basic pool data (fallback)
 * Used when time-based snapshots are not available
 */
export const BASIC_PROTOCOL_STATS_QUERY = `
  query GetBasicProtocolStats {
    pools(orderBy: tvlUSD_DESC) {
      poolTVL: tvlUSD
      poolAlltimeVolume: volumeUSD
    }
  }
`;

/**
 * Query to get the latest block timestamp for reference
 */
export const LATEST_BLOCK_QUERY = `
  query GetLatestBlock {
    blocks(
      orderBy: timestamp_DESC
      limit: 1
    ) {
      timestamp
    }
  }
`;
