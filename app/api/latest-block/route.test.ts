import {NextRequest} from "next/server";
import {request} from "graphql-request";
import {GET} from "./route";

jest.mock("@/src/utils/constants", () => ({
  SQDIndexerUrl: "https://mock-squid-indexer.com",
  NetworkUrl: "https://mock-network-url.com",
}));

jest.mock("graphql-request", () => ({
  request: jest.fn(),
  gql: jest.fn((query) => {}),
}));

jest.mock("fuels", () => ({
  DateTime: {
    fromTai64: jest.fn().mockImplementation(() => ({
      getTime: jest.fn().mockReturnValue(1633036800000), // Mock Unix milliseconds
    })),
  },
}));

describe("test for GET /api/latest-block", () => {
  const mockSquidStatus = {squidStatus: {finalizedHeight: 123}};
  const mockBlockData = {
    block: {
      header: {
        time: "0x1", // Mock TAI64 timestamp
      },
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns the transformed latest block data", async () => {
    // Mocking responses for fetchSquidStatus and fetchBlockByHeight
    (request as jest.Mock)
      .mockResolvedValueOnce(mockSquidStatus) // Mock SquidStatus
      .mockResolvedValueOnce(mockBlockData);

    // Create a mock request
    const req = new NextRequest("https://mock-api.com/api/latest-block");

    // Call the GET function
    const res = await GET(req);

    // Assert the response status
    expect(res.status).toBe(200);

    // Parse the JSON response
    const json = await res.json();

    // Verify the transformed response
    expect(json).toEqual({
      block: {
        blockNumber: 123,
        blockTimestamp: expect.any(Number), // Ensure blockTimestamp is present
      },
    });
  });

  it("returns 500 if fetchSquidStatus fails", async () => {
    const req = new NextRequest("https://mock-api.com/api/latest-block");
    const res = await GET(req);

    expect(res.status).toBe(500);
    const jsonResponse = await res.json();
    expect(jsonResponse).toEqual({
      error: "An unexpected error occurred while fetching latest block",
    });

    expect(request).toHaveBeenCalledTimes(1); // Only fetchSquidStatus should be called
  });

  it("returns 500 if fetchBlockByHeight fails", async () => {
    (request as jest.Mock)
      .mockResolvedValueOnce(mockSquidStatus)
      .mockRejectedValueOnce(new Error("Failed to fetch block data"));

    const req = new NextRequest("https://mock-api.com/api/latest-block");
    const res = await GET(req);

    expect(res.status).toBe(500);
    const jsonResponse = await res.json();
    expect(jsonResponse).toEqual({
      error: "An unexpected error occurred while fetching latest block",
    });

    expect(request).toHaveBeenCalledTimes(2); // Both functions should be called
  });
});
