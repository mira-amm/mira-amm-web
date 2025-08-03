/**
 * TypeScript interfaces for Protocol Stats GraphQL responses
 * Based on Subsquid endpoint data structure
 */

/**
 * Pool snapshot data for time-based volume calculations
 */
export interface PoolSnapshot {
  poolHourVolume: number;
}

/**
 * Individual pool data from GraphQL response
 */
export interface PoolData {
  /** Total Value Locked in the pool */
  poolTVL: number;
  /** All-time volume for the pool */
  poolAlltimeVolume: number;
  /** 24-hour snapshot data */
  snapshot24hours: PoolSnapshot[];
  /** 7-day snapshot data */
  snapshot7days: PoolSnapshot[];
}

/**
 * Complete GraphQL response structure from Subsquid
 */
export interface GraphQLResponse {
  pools: PoolData[];
}

/**
 * Processed protocol statistics data
 */
export interface ProtocolStatsData {
  /** Total all-time volume across all pools */
  allTimeVolume: number;
  /** Total Value Locked across all pools */
  totalTVL: number;
  /** Volume in the last 24 hours */
  oneDayVolume: number;
  /** Volume in the last 7 days */
  sevenDayVolume: number;
}

/**
 * Cached stats data with metadata
 */
export interface CachedStatsData {
  data: ProtocolStatsData;
  timestamp: number;
  expiresAt: number;
}

/**
 * Props for the main ProtocolStats component (client-side rendering)
 */
export interface ProtocolStatsProps {
  className?: string;
}

/**
 * Props for individual stat card components
 */
export interface StatCardProps {
  title: string;
  value?: number;
  formatAsCurrency?: boolean;
  className?: string;
  isLoading?: boolean;
}

/**
 * GraphQL query variables for time-based filtering
 */
export interface QueryVariables {
  timestamp24h?: number;
  timestamp7d?: number;
}
