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

export class SubsquidIndexer implements ISubsquidIndexer {
  readonly pools: IPoolIndexer;
  readonly assets: IAssetIndexer;
  readonly events: IEventIndexer;
  readonly stats: IStatsIndexer;
  readonly endpoint: string;
  readonly config?: IndexerConfig;

  private client: GraphQLClient;

  constructor(endpoint?: string, config?: IndexerConfig) {
    this.endpoint =
      endpoint ||
      process.env["NEXT_PUBLIC_SUBSQUID_ENDPOINT"] ||
      DEFAULT_ENDPOINT;
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
