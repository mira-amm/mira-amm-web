import {statsService} from "./stats-service";
import type {ProtocolStatsData} from "../types/protocol-stats";

/**
 * Background refresh manager for protocol stats
 * Implements intelligent refresh strategies to keep data fresh
 */
class BackgroundRefreshManager {
  private refreshInterval: NodeJS.Timeout | null = null;
  private isRefreshing = false;
  private lastRefreshTime = 0;
  private refreshListeners: Array<(data: ProtocolStatsData) => void> = [];

  // Configuration
  private readonly REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes
  private readonly MIN_REFRESH_GAP = 30 * 1000; // 30 seconds minimum between refreshes
  private readonly MAX_RETRIES = 3;

  /**
   * Start background refresh process
   */
  startBackgroundRefresh(): void {
    if (this.refreshInterval) {
      return; // Already running
    }

    console.log("Starting background protocol stats refresh");

    this.refreshInterval = setInterval(() => {
      this.performBackgroundRefresh();
    }, this.REFRESH_INTERVAL);

    // Perform initial refresh
    this.performBackgroundRefresh();
  }

  /**
   * Stop background refresh process
   */
  stopBackgroundRefresh(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
      console.log("Stopped background protocol stats refresh");
    }
  }

  /**
   * Perform a background refresh with retry logic
   */
  private async performBackgroundRefresh(retryCount = 0): Promise<void> {
    // Prevent concurrent refreshes
    if (this.isRefreshing) {
      return;
    }

    // Respect minimum refresh gap
    const timeSinceLastRefresh = Date.now() - this.lastRefreshTime;
    if (timeSinceLastRefresh < this.MIN_REFRESH_GAP) {
      return;
    }

    this.isRefreshing = true;

    try {
      console.log("Background refresh: Fetching fresh protocol stats...");

      const startTime = Date.now();
      const freshData = await statsService.fetchProtocolStats();
      const duration = Date.now() - startTime;

      console.log(
        `Background refresh: Successfully refreshed stats in ${duration}ms`
      );

      // Notify listeners of fresh data
      this.notifyListeners(freshData);

      this.lastRefreshTime = Date.now();
    } catch (error) {
      console.error("Background refresh failed:", error);

      // Retry with exponential backoff
      if (retryCount < this.MAX_RETRIES) {
        const backoffDelay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s

        console.log(
          `Background refresh: Retrying in ${backoffDelay}ms (attempt ${retryCount + 1}/${this.MAX_RETRIES})`
        );

        setTimeout(() => {
          this.performBackgroundRefresh(retryCount + 1);
        }, backoffDelay);
      }
    } finally {
      this.isRefreshing = false;
    }
  }

  /**
   * Force an immediate refresh (respects minimum gap)
   */
  async forceRefresh(): Promise<ProtocolStatsData | null> {
    try {
      await this.performBackgroundRefresh();
      return await statsService.fetchProtocolStats();
    } catch (error) {
      console.error("Force refresh failed:", error);
      return null;
    }
  }

  /**
   * Add listener for refresh events
   */
  onRefresh(callback: (data: ProtocolStatsData) => void): () => void {
    this.refreshListeners.push(callback);

    // Return unsubscribe function
    return () => {
      const index = this.refreshListeners.indexOf(callback);
      if (index > -1) {
        this.refreshListeners.splice(index, 1);
      }
    };
  }

  /**
   * Notify all listeners of fresh data
   */
  private notifyListeners(data: ProtocolStatsData): void {
    this.refreshListeners.forEach((callback) => {
      try {
        callback(data);
      } catch (error) {
        console.error("Error in refresh listener:", error);
      }
    });
  }

  /**
   * Get refresh status
   */
  getStatus(): {
    isRunning: boolean;
    isRefreshing: boolean;
    lastRefreshTime: number;
    listenerCount: number;
  } {
    return {
      isRunning: this.refreshInterval !== null,
      isRefreshing: this.isRefreshing,
      lastRefreshTime: this.lastRefreshTime,
      listenerCount: this.refreshListeners.length,
    };
  }
}

// Export singleton instance
export const backgroundRefreshManager = new BackgroundRefreshManager();

/**
 * Initialize background refresh for server environments
 * Should be called during application startup
 */
export function initializeBackgroundRefresh(): void {
  // Only run in server environments
  if (typeof window === "undefined") {
    backgroundRefreshManager.startBackgroundRefresh();

    // Cleanup on process termination
    process.on("SIGTERM", () => {
      backgroundRefreshManager.stopBackgroundRefresh();
    });

    process.on("SIGINT", () => {
      backgroundRefreshManager.stopBackgroundRefresh();
    });
  }
}

/**
 * Enhanced cache headers utility
 */
export function createCacheHeaders(options: {
  maxAge?: number;
  staleWhileRevalidate?: number;
  mustRevalidate?: boolean;
}): Record<string, string> {
  const {
    maxAge = 60, // 1 minute
    staleWhileRevalidate = 300, // 5 minutes
    mustRevalidate = false,
  } = options;

  const cacheDirectives = [
    `s-maxage=${maxAge}`,
    `stale-while-revalidate=${staleWhileRevalidate}`,
  ];

  if (mustRevalidate) {
    cacheDirectives.push("must-revalidate");
  }

  return {
    "Cache-Control": cacheDirectives.join(", "),
    "CDN-Cache-Control": `s-maxage=${maxAge}`,
    Vary: "Accept-Encoding",
  };
}
