import {GraphQLClient} from "graphql-request";
import {SQDIndexerUrl} from "../utils/constants";

/**
 * GraphQL client configuration for Subsquid endpoint
 * Used to fetch protocol statistics data
 */
export class SubsquidGraphQLClient {
  private client: GraphQLClient;

  constructor(endpoint?: string) {
    const graphqlEndpoint =
      endpoint || process.env.NEXT_PUBLIC_SUBSQUID_ENDPOINT || SQDIndexerUrl;

    this.client = new GraphQLClient(graphqlEndpoint, {
      headers: {
        "Content-Type": "application/json",
      },
    });
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
      console.error("GraphQL query failed:", error);
      throw new Error(
        `GraphQL query failed: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  /**
   * Get the underlying GraphQL client instance
   */
  getClient(): GraphQLClient {
    return this.client;
  }
}

// Export a singleton instance
export const subsquidClient = new SubsquidGraphQLClient();
