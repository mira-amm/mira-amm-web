import {GraphQLClient} from "graphql-request";
import {
  ISubsquidIndexer,
  IPoolIndexer,
  IAssetIndexer,
  IEventIndexer,
  IStatsIndexer,
  IndexerConfig,
} from "../interfaces";
import {PoolIndexer} from "./PoolIndexer";
import {AssetIndexer} from "./AssetIndexer";
import {EventIndexer} from "./EventIndexer";
import {StatsIndexer} from "./StatsIndexer";

const DEFAULT_ENDPOINT =
  "https://mira-dex.squids.live/mira-indexer@v3/api/graphql";

const LOCAL_INDEXER_ENDPOINT = "http://localhost:4350/graphql";

/**
 * Determines the appropriate indexer endpoint based on the current environment
 * and network configuration.
 */
function getIndexerEndpoint(customEndpoint?: string): string {
  // If custom endpoint is provided, use it
  if (customEndpoint) {
    return customEndpoint;
  }

  // Check environment variable first
  const envEndpoint = process.env["NEXT_PUBLIC_SUBSQUID_ENDPOINT"];
  if (envEndpoint) {
    return envEndpoint;
  }

  // Auto-detect local development mode
  // Check if we're in a browser environment and can access the Fuel provider
  if (typeof window !== "undefined") {
    try {
      // Check if NetworkUrl from constants indicates localhost development
      const networkUrl =
        process.env.NEXT_PUBLIC_NETWORK_URL || (globalThis as any)?.NETWORK_URL;

      if (networkUrl && networkUrl.includes("localhost:4000")) {
        console.log(
          "🔧 IndexerConfig: Auto-detected localhost network, using local indexer"
        );
        return LOCAL_INDEXER_ENDPOINT;
      }
    } catch (error) {
      // Ignore errors in auto-detection
    }
  }

  // Check server-side environment variables for local development
  if (process.env.NODE_ENV === "development") {
    const networkUrl = process.env.NEXT_PUBLIC_NETWORK_URL;
    if (networkUrl && networkUrl.includes("localhost:4000")) {
      console.log(
        "🔧 IndexerConfig: Auto-detected localhost network (server), using local indexer"
      );
      return LOCAL_INDEXER_ENDPOINT;
    }
  }

  return DEFAULT_ENDPOINT;
}

export class SubsquidIndexer implements ISubsquidIndexer {
  readonly pools: IPoolIndexer;
  readonly assets: IAssetIndexer;
  readonly events: IEventIndexer;
  readonly stats: IStatsIndexer;
  readonly endpoint: string;
  readonly config?: IndexerConfig;

  private client: GraphQLClient;

  constructor(endpoint?: string, config?: IndexerConfig) {
    this.endpoint = getIndexerEndpoint(endpoint);
    this.config = config;

    // Initialize GraphQL client
    this.client = new GraphQLClient(this.endpoint, {
      headers: config?.headers,
    });

    // Initialize sub-indexers
    this.pools = new PoolIndexer(this);
    this.assets = new AssetIndexer(this);
    this.events = new EventIndexer(this);
    this.stats = new StatsIndexer(this);
  }

  async query<T = any>(
    query: string,
    variables?: Record<string, any>
  ): Promise<T> {
    const maxRetries = this.config?.retryAttempts || 3;
    const retryDelay = this.config?.retryDelay || 1000;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await this.client.request<T>(query, variables);
      } catch (error) {
        if (attempt === maxRetries) {
          throw new Error(
            `GraphQL query failed after ${maxRetries} attempts: ${
              error instanceof Error ? error.message : "Unknown error"
            }`
          );
        }

        // Wait before retrying with exponential backoff
        const delay = retryDelay * Math.pow(2, attempt - 1);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    throw new Error("Query failed unexpectedly");
  }
}
