/**
 * GraphQL queries for protocol statistics
 * Fetches data from Subsquid endpoint for protocol-wide metrics
 */

/**
 * Main query to fetch all protocol statistics data
 * Includes TVL, all-time volume, and time-based volume snapshots
 * Supports both traditional AMM and binned liquidity pools
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
      # Binned liquidity specific fields
      binStep
      activeId
      totalBins
      activeBinLiquidity {
        x
        y
      }
    }
  }
`;

/**
 * Simplified query for basic pool data (fallback)
 * Used when time-based snapshots are not available
 * Supports both traditional AMM and binned liquidity pools
 */
export const BASIC_PROTOCOL_STATS_QUERY = `
  query GetBasicProtocolStats {
    pools(orderBy: tvlUSD_DESC) {
      poolTVL: tvlUSD
      poolAlltimeVolume: volumeUSD
      # Binned liquidity basic fields
      binStep
      activeId
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

/**
 * Query specifically for binned liquidity pool details
 * Includes bin-specific information and liquidity distribution
 */
export const BINNED_LIQUIDITY_POOL_QUERY = `
  query GetBinnedLiquidityPool($poolId: String!) {
    pool(id: $poolId) {
      id
      binStep
      activeId
      assetX {
        id
        symbol
        decimals
      }
      assetY {
        id
        symbol
        decimals
      }
      totalBins
      bins(where: {liquidity_gt: "0"}) {
        binId
        liquidity {
          x
          y
        }
        price
        feesX
        feesY
      }
      protocolFees {
        x
        y
      }
      totalFeesCollected {
        x
        y
      }
    }
  }
`;

/**
 * Query for binned liquidity events with bin-specific details
 */
export const BINNED_LIQUIDITY_EVENTS_QUERY = `
  query GetBinnedLiquidityEvents($fromBlock: Int!, $toBlock: Int!, $poolId: String) {
    binnedLiquidityEvents(
      where: {
        blockNumber_gte: $fromBlock
        blockNumber_lte: $toBlock
        pool: $poolId
      }
      orderBy: blockNumber_ASC
    ) {
      id
      type
      blockNumber
      timestamp
      transaction
      pool {
        id
        binStep
        activeId
      }
      sender
      recipient
      binId
      amountsIn {
        x
        y
      }
      amountsOut {
        x
        y
      }
      totalFees {
        x
        y
      }
      protocolFees {
        x
        y
      }
      binIds
      amounts {
        x
        y
      }
      lpTokenMinted
      lpTokenBurned
    }
  }
`;
