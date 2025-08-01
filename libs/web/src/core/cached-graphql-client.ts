import {GraphQLClient} from "graphql-request";
import axios from "axios";
import {setupCache, buildMemoryStorage} from "axios-cache-interceptor";
import {SQDIndexerUrl} from "../utils/constants";

/**
 * GraphQL client with built-in HTTP caching
 * Uses axios-cache-interceptor for automatic request caching
 */
export class CachedGraphQLClient {
  private client: GraphQLClient;
  private axiosInstance: any;

  constructor(endpoint?: string) {
    const graphqlEndpoint =
      endpoint || process.env.NEXT_PUBLIC_SUBSQUID_ENDPOINT || SQDIndexerUrl;

    console.log("GraphQL Client initialized with endpoint:", graphqlEndpoint);

    // Create axios instance with caching
    this.axiosInstance = setupCache(axios.create(), {
      // Cache for 5 minutes by default
      ttl: 5 * 60 * 1000,
      // Use memory storage (perfect for 4 values)
      storage: buildMemoryStorage(),
      // Cache based on URL and request body
      generateKey: (req) => `${req.url}:${JSON.stringify(req.data)}`,
      // Enable debug logging in development
      debug: process.env.NODE_ENV === "development",
    });

    // Create simple GraphQL client (remove complex caching for now)
    this.client = new GraphQLClient(graphqlEndpoint);
  }

  /**
   * Execute a GraphQL query with automatic caching
   */
  async query<T = any>(
    query: string,
    variables?: Record<string, any>
  ): Promise<T> {
    try {
      return await this.client.request<T>(query, variables);
    } catch (error) {
      throw new Error(
        `GraphQL query failed: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  /**
   * Clear the cache
   */
  clearCache(): void {
    if (this.axiosInstance.storage) {
      this.axiosInstance.storage.clear();
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): any {
    return this.axiosInstance.storage?.data || {};
  }
}

// Lazy-loaded singleton instance for SSR compatibility
let _cachedSubsquidClient: CachedGraphQLClient | null = null;

export function getCachedSubsquidClient(): CachedGraphQLClient {
  if (!_cachedSubsquidClient) {
    _cachedSubsquidClient = new CachedGraphQLClient();
  }
  return _cachedSubsquidClient;
}

// Export singleton instance using getter for lazy loading
export const cachedSubsquidClient = {
  query: <T = any>(
    query: string,
    variables?: Record<string, any>
  ): Promise<T> => getCachedSubsquidClient().query<T>(query, variables),
  clearCache: (): void => getCachedSubsquidClient().clearCache(),
  getCacheStats: (): any => getCachedSubsquidClient().getCacheStats(),
};
