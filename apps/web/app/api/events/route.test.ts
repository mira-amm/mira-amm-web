import {GET} from "./route";
import {NextRequest} from "next/server";
import {request} from "graphql-request";
import {SQDIndexerUrl} from "../../../../../libs/web/src/utils/constants";

jest.mock("../../../../../libs/web/src/utils/constants", () => ({
  SQDIndexerUrl: "https://mock-squid-indexer.com",
}));

jest.mock("graphql-request", () => ({
  request: jest.fn(),
  gql: jest.fn((query) => "dummy_query"),
}));

describe("test for GET /api/events", () => {
  const mockRequest = request as jest.Mock;

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should return 400 if fromBlock or toBlock is missing", async () => {
    const req = new NextRequest(
      "http://localhost:3000/api/events?fromBlock=100",
    ); // Missing toBlock

    const response = await GET(req);

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: "Both 'fromBlock' and 'toBlock' are required",
    });
  });

  it("should return 200 with events for the given block range", async () => {
    const req = new NextRequest(
      "http://localhost:3000/api/events?fromBlock=100&toBlock=200",
    );

    const mockActions = {
      actions: [
        {
          pool: {id: "pool1"},
          asset0: {id: "asset0", decimals: 6},
          asset1: {id: "asset1", decimals: 9},
          amount1Out: "1000",
          amount1In: "0",
          amount0Out: "0",
          amount0In: "500",
          reserves0After: "1000",
          reserves1After: "2001",
          type: "ADD_LIQUIDITY",
          transaction: "txn1",
          recipient: "recipient_address1",
          timestamp: 1234567890,
          blockNumber: 1,
        },
        {
          pool: {id: "pool2"},
          asset0: {id: "asset0", decimals: 9},
          asset1: {id: "asset1", decimals: 9},
          amount1Out: "1001",
          amount1In: "0",
          amount0Out: "0",
          amount0In: "300",
          reserves0After: "2000",
          reserves1After: "4000",
          type: "SWAP",
          transaction: "txn2",
          recipient: "recipient_address2",
          timestamp: 1234567891,
          blockNumber: 2,
        },
      ],
    };

    mockRequest.mockResolvedValueOnce(mockActions);

    const response = await GET(req);
    expect(response.status).toBe(200);
    const jsonResponse = await response.json();

    expect(jsonResponse).toEqual({
      events: [
        {
          block: {
            blockNumber: 1,
            blockTimestamp: 1234567890,
          },
          txnId: "txn1",
          txnIndex: 0,
          eventIndex: 0,
          maker: "recipient_address1",
          pairId: "pool1",
          reserves: {
            asset0: "0.001000",
            asset1: "0.000002001",
          },
          eventType: "join",
          amount0: "0.000500",
          amount1: "0.000001000",
        },
        {
          block: {
            blockNumber: 2,
            blockTimestamp: 1234567891,
          },
          txnId: "txn2",
          txnIndex: 0,
          eventIndex: 0,
          maker: "recipient_address2",
          pairId: "pool2",
          reserves: {
            asset0: "0.000002000",
            asset1: "0.000004000",
          },
          eventType: "swap",
          asset0In: "0.000000300",
          asset1Out: "0.000001001",
          priceNative: 0.29970029970029965,
        },
      ],
    });
    expect(mockRequest).toHaveBeenCalledWith({
      url: SQDIndexerUrl,
      document: "dummy_query",
      variables: {fromBlock: 100, toBlock: 200},
    });
  });

  it("should return an empty events array if no actions are found", async () => {
    const req = new NextRequest(
      "http://localhost:3000/api/events?fromBlock=100&toBlock=200",
    );

    mockRequest.mockResolvedValueOnce({actions: []});

    const response = await GET(req);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({events: []});
  });

  it("should return a 500 error if there is an exception", async () => {
    const req = new NextRequest(
      "http://localhost:3000/api/events?fromBlock=100&toBlock=200",
    );

    mockRequest.mockRejectedValueOnce(new Error("Network error"));

    const response = await GET(req);

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      error: "Failed to fetch events data",
    });
  });
});
