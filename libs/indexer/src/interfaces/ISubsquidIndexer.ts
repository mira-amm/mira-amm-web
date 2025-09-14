import {IPoolIndexer} from "./IPoolIndexer";
import {IAssetIndexer} from "./IAssetIndexer";
import {IEventIndexer} from "./IEventIndexer";
import {IStatsIndexer} from "./IStatsIndexer";

export interface IndexerConfig {
  endpoint?: string;
  headers?: Record<string, string>;
  retryAttempts?: number;
  retryDelay?: number;
  timeout?: number;
  cache?: {
    enabled: boolean;
    ttl?: number;
  };
}

export interface ISubsquidIndexer {
  readonly pools: IPoolIndexer;
  readonly assets: IAssetIndexer;
  readonly events: IEventIndexer;
  readonly stats: IStatsIndexer;

  readonly endpoint: string;
  readonly config?: IndexerConfig;

  query<T = any>(query: string, variables?: Record<string, any>): Promise<T>;
}
