import {describe, it, expect, vi, afterEach} from "vitest";
import {NextRequest} from "next/server";
import {request, gql} from "graphql-request";
import {GET} from "./route";
import {SQDIndexerUrl} from "../../../../../libs/web/src/utils/constants";
import type {SpyInstance} from "vitest";

vi.mock("../../../../../libs/web/src/utils/constants", () => ({
  SQDIndexerUrl: "https://mock-squid-indexer.com",
}));

vi.mock("graphql-request", () => ({
  request: vi.fn(),
  gql: vi.fn((query: string) => "dummy_query"),
}));

describe("GET /api/events", () => {
  const mockRequest = request as SpyInstance;

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should return 400 if fromBlock or toBlock is missing", async () => {
    const req = new NextRequest(
      "http://localhost:3000/api/events/?fromBlock=100"
    ); // Missing toBlock

    const res = await GET(req);
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({
      error: "'fromBlock' and 'toBlock' must be valid and ordered",
    });
  });

  it("should return 200 with events for the given block range", async () => {
    const req = new NextRequest(
      "http://localhost:3000/api/events/?fromBlock=100&toBlock=200"
    );

    const mockActions = {
      actions: [
        {
          id: "action1",
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
          id: "action2",
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

    const res = await GET(req);
    expect(res.status).toBe(200);
    const json = await res.json();

    expect(json).toEqual({
      events: [
        {
          block: {blockNumber: 1, blockTimestamp: 1234567890},
          txnId: "txn1",
          txnIndex: 0,
          eventIndex: 0,
          maker: "recipient_address1",
          pairId: "pool1",
          reserves: {asset0: "0.001000", asset1: "0.000002001"},
          eventType: "join",
          amount0: "0.000500",
          amount1: "0.000000000",
        },
        {
          block: {blockNumber: 2, blockTimestamp: 1234567891},
          txnId: "txn2",
          txnIndex: 0,
          eventIndex: 0,
          maker: "recipient_address2",
          pairId: "pool2",
          reserves: {asset0: "0.000002000", asset1: "0.000004000"},
          eventType: "swap",
          asset0In: "0.000000300",
          asset1Out: "0.000001001",
          priceNative: 3.336666666666667, // asset1Out / asset0In = 0.000001001 / 0.000000300
        },
      ],
    });

    expect(mockRequest).toHaveBeenCalledWith({
      url: SQDIndexerUrl,
      document: "dummy_query",
      variables: {fromBlock: 100, toBlock: 200},
    });
  });

  it("should handle V2 liquidity events", async () => {
    const req = new NextRequest(
      "http://localhost:3000/api/events/?fromBlock=10&toBlock=20"
    );

    const mockActions = {
      actions: [
        {
          id: "action-v2",
          pool: {id: "pool-v2"},
          asset0: {id: "asset0", decimals: 9},
          asset1: {id: "asset1", decimals: 6},
          amount1Out: "0",
          amount1In: "1000",
          amount0Out: "0",
          amount0In: "500",
          reserves0After: "5000",
          reserves1After: "10000",
          type: "ADD_LIQUIDITY_V2",
          transaction: "txn-v2",
          recipient: "recipient-v2",
          timestamp: 111111,
          blockNumber: 12,
        },
      ],
    };

    mockRequest.mockResolvedValueOnce(mockActions);

    const res = await GET(req);
    expect(res.status).toBe(200);
    const json = await res.json();

    expect(json).toEqual({
      events: [
        {
          block: {blockNumber: 12, blockTimestamp: 111111},
          txnId: "txn-v2",
          txnIndex: 0,
          eventIndex: 0,
          maker: "recipient-v2",
          pairId: "pool-v2",
          reserves: {asset0: "0.000005000", asset1: "0.010000"},
          eventType: "join",
          amount0: "0.000000500",
          amount1: "0.001000",
        },
      ],
    });
  });

  it("should return an empty events array if no actions are found", async () => {
    const req = new NextRequest(
      "http://localhost:3000/api/events/?fromBlock=100&toBlock=200"
    );

    mockRequest.mockResolvedValueOnce({actions: []});

    const res = await GET(req);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({events: []});
  });

  it("should return a 500 error if there is an exception", async () => {
    const req = new NextRequest(
      "http://localhost:3000/api/events/?fromBlock=100&toBlock=200"
    );

    mockRequest.mockRejectedValueOnce(new Error("Network error"));

    const res = await GET(req);
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({
      error: "Failed to fetch events data",
    });
  });

  it("should properly index transactions and events within a block", async () => {
    const req = new NextRequest(
      "http://localhost:3000/api/events/?fromBlock=100&toBlock=200"
    );

    const mockActions = {
      actions: [
        // Block 1, Transaction 1, Event 1
        {
          id: "action1",
          pool: {id: "pool1"},
          asset0: {id: "asset0", decimals: 9},
          asset1: {id: "asset1", decimals: 9},
          amount1Out: "1000",
          amount1In: "0",
          amount0Out: "0",
          amount0In: "500",
          reserves0After: "1000",
          reserves1After: "2000",
          type: "SWAP",
          transaction: "txn1",
          recipient: "recipient1",
          timestamp: 1234567890,
          blockNumber: 1,
        },
        // Block 1, Transaction 1, Event 2
        {
          id: "action2",
          pool: {id: "pool2"},
          asset0: {id: "asset0", decimals: 9},
          asset1: {id: "asset1", decimals: 9},
          amount1Out: "2000",
          amount1In: "0",
          amount0Out: "0",
          amount0In: "600",
          reserves0After: "1500",
          reserves1After: "3000",
          type: "SWAP",
          transaction: "txn1",
          recipient: "recipient1",
          timestamp: 1234567890,
          blockNumber: 1,
        },
        // Block 1, Transaction 2, Event 1
        {
          id: "action3",
          pool: {id: "pool3"},
          asset0: {id: "asset0", decimals: 9},
          asset1: {id: "asset1", decimals: 9},
          amount1Out: "3000",
          amount1In: "0",
          amount0Out: "0",
          amount0In: "700",
          reserves0After: "2000",
          reserves1After: "4000",
          type: "SWAP",
          transaction: "txn2",
          recipient: "recipient2",
          timestamp: 1234567890,
          blockNumber: 1,
        },
      ],
    };

    mockRequest.mockResolvedValueOnce(mockActions);

    const res = await GET(req);
    expect(res.status).toBe(200);
    const json = await res.json();

    expect(json.events).toHaveLength(3);
    
    // Verify first event in first transaction
    expect(json.events[0].txnIndex).toBe(0);
    expect(json.events[0].eventIndex).toBe(0);
    expect(json.events[0].txnId).toBe("txn1");

    // Verify second event in first transaction
    expect(json.events[1].txnIndex).toBe(0);
    expect(json.events[1].eventIndex).toBe(1);
    expect(json.events[1].txnId).toBe("txn1");

    // Verify first event in second transaction
    expect(json.events[2].txnIndex).toBe(1);
    expect(json.events[2].eventIndex).toBe(0);
    expect(json.events[2].txnId).toBe("txn2");
  });
});
