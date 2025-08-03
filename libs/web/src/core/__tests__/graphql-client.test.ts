import {describe, it, expect, vi, beforeEach} from "vitest";
import {SimpleGraphQLClient} from "../graphql-client";

// Mock graphql-request
vi.mock("graphql-request", () => ({
  GraphQLClient: vi.fn().mockImplementation(() => ({
    request: vi.fn(),
  })),
}));

describe("SimpleGraphQLClient", () => {
  let client: SimpleGraphQLClient;

  beforeEach(() => {
    vi.clearAllMocks();
    client = new SimpleGraphQLClient("https://test-endpoint.com");
  });

  it("should create client with provided endpoint", () => {
    expect(client).toBeInstanceOf(SimpleGraphQLClient);
  });

  it("should use default endpoint when none provided", () => {
    const defaultClient = new SimpleGraphQLClient();
    expect(defaultClient).toBeInstanceOf(SimpleGraphQLClient);
  });

  it("should handle query execution", async () => {
    const mockResponse = {data: "test"};
    const mockRequest = vi.fn().mockResolvedValue(mockResponse);

    // Mock the GraphQLClient's request method
    const {GraphQLClient} = await import("graphql-request");
    vi.mocked(GraphQLClient).mockImplementation(
      () =>
        ({
          request: mockRequest,
        }) as any
    );

    const testClient = new SimpleGraphQLClient("https://test-endpoint.com");
    const result = await testClient.query("{ test }");

    expect(mockRequest).toHaveBeenCalledWith("{ test }", undefined);
    expect(result).toEqual(mockResponse);
  });

  it("should handle query errors", async () => {
    const mockError = new Error("Network error");
    const mockRequest = vi.fn().mockRejectedValue(mockError);

    const {GraphQLClient} = await import("graphql-request");
    vi.mocked(GraphQLClient).mockImplementation(
      () =>
        ({
          request: mockRequest,
        }) as any
    );

    const testClient = new SimpleGraphQLClient("https://test-endpoint.com");

    await expect(testClient.query("{ test }")).rejects.toThrow(
      "GraphQL query failed: Network error"
    );
  });
});
