/**
 * Utility functions for timestamp calculations
 * Used for time-based GraphQL queries in protocol stats
 */

/**
 * Calculate timestamp for a given number of days ago
 * @param daysAgo Number of days to subtract from current time
 * @returns Unix timestamp in seconds
 */
export function getTimestampDaysAgo(daysAgo: number): number {
  const now = new Date();
  const targetDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
  return Math.floor(targetDate.getTime() / 1000);
}

/**
 * Get timestamp for 24 hours ago
 * @returns Unix timestamp in seconds
 */
export function get24HoursAgoTimestamp(): number {
  return getTimestampDaysAgo(1);
}

/**
 * Get timestamp for 7 days ago
 * @returns Unix timestamp in seconds
 */
export function get7DaysAgoTimestamp(): number {
  return getTimestampDaysAgo(7);
}

/**
 * Format timestamp to human-readable date
 * @param timestamp Unix timestamp in seconds
 * @returns Formatted date string
 */
export function formatTimestamp(timestamp: number): string {
  return new Date(timestamp * 1000).toISOString();
}
