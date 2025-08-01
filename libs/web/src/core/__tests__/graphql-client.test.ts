import {describe, it, expect, vi, beforeEach} from "vitest";
import {SubsquidGraphQLClient} from "../graphql-client";

// Mock graphql-request
vi.mock("graphql-request", () => ({
  GraphQLClient: vi.fn().mockImplementation(() => ({
    request: vi.fn(),
  })),
}));

describe("SubsquidGraphQLClient", () => {
  let client: SubsquidGraphQLClient;

  beforeEach(() => {
    vi.clearAllMocks();
    client = new SubsquidGraphQLClient("https://test-endpoint.com");
  });

  it("should create client with provided endpoint", () => {
    expect(client).toBeInstanceOf(SubsquidGraphQLClient);
  });

  it("should use default endpoint when none provided", () => {
    const defaultClient = new SubsquidGraphQLClient();
    expect(defaultClient).toBeInstanceOf(SubsquidGraphQLClient);
  });

  it("should handle query execution", async () => {
    const mockResponse = {data: "test"};
    const mockRequest = vi.fn().mockResolvedValue(mockResponse);

    // Mock the client's request method
    vi.spyOn(client.getClient(), "request").mockImplementation(mockRequest);

    const result = await client.query("{ test }");

    expect(mockRequest).toHaveBeenCalledWith("{ test }", undefined);
    expect(result).toEqual(mockResponse);
  });

  it("should handle query errors", async () => {
    const mockError = new Error("Network error");
    vi.spyOn(client.getClient(), "request").mockRejectedValue(mockError);

    await expect(client.query("{ test }")).rejects.toThrow(
      "GraphQL query failed: Network error"
    );
  });
});
