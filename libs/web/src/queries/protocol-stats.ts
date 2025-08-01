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
    pools {
      poolTVL
      poolAlltimeVolume
      snapshot24hours: poolSnapshots(
        where: { timestamp_gte: $timestamp24h }
        orderBy: timestamp_ASC
      ) {
        poolHourVolume
      }
      snapshot7days: poolSnapshots(
        where: { timestamp_gte: $timestamp7d }
        orderBy: timestamp_ASC
      ) {
        poolHourVolume
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
    pools {
      poolTVL
      poolAlltimeVolume
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
