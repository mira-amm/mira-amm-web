import {GraphQLClient} from "graphql-request";
import {SQDIndexerUrl} from "../utils/constants";

/**
 * Simple GraphQL client for protocol statistics
 */
export class SimpleGraphQLClient {
  private client: GraphQLClient;

  constructor(endpoint?: string) {
    const graphqlEndpoint =
      endpoint || process.env.NEXT_PUBLIC_SUBSQUID_ENDPOINT || SQDIndexerUrl;

    this.client = new GraphQLClient(graphqlEndpoint);
  }

  /**
   * Execute a GraphQL query
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
}

// Lazy-loaded singleton instance for SSR compatibility
let _subsquidClient: SimpleGraphQLClient | null = null;

export function getSubsquidClient(): SimpleGraphQLClient {
  if (!_subsquidClient) {
    _subsquidClient = new SimpleGraphQLClient();
  }
  return _subsquidClient;
}

// Export singleton instance using getter for lazy loading
export const subsquidClient = {
  query: <T = any>(
    query: string,
    variables?: Record<string, any>
  ): Promise<T> => getSubsquidClient().query<T>(query, variables),
};
