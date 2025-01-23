import {GET} from "./route";
import {NextRequest} from "next/server";
import {request} from "graphql-request";
import {SQDIndexerUrl} from "@/src/utils/constants";
import {NotFoundError} from "@/src/utils/errors";

jest.mock("@/src/utils/constants", () => ({
  SQDIndexerUrl: "https://mock-squid-indexer.com",
}));

jest.mock("graphql-request", () => ({
  request: jest.fn(),
  gql: jest.fn((query) => "dummy_pool_query"),
}));

describe("test for GET /api/pair", () => {
  const mockRequest = request as jest.Mock;
  const mockPoolId = "pool1";
  const mockPoolData = {
    id: mockPoolId,
    asset0: {
      id: "mock-asset-0-id",
    },
    asset1: {
      id: "mock-asset-1-id",
    },
    creationBlock: 123456,
    creationTime: 1638384745,
    creationTx: "mock-tx-id",
  };

  const mockPairData = {
    pair: {
      id: mockPoolId,
      dexKey: "uniswap",
      asset0Id: mockPoolData.asset0.id,
      asset1Id: mockPoolData.asset1.id,
      createdAtBlockNumber: mockPoolData.creationBlock,
      createdAtBlockTimestamp: mockPoolData.creationTime,
      createdAtTxnId: mockPoolData.creationTx,
    },
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should return 400 if 'id' query parameter is missing", async () => {
    const req = new NextRequest("https://mock-api.com/api/pair");
    const res = await GET(req);

    expect(res.status).toBe(400);
    const jsonResponse = await res.json();
    expect(jsonResponse).toEqual({error: "Pool ID(param: id) is required"});
  });

  it("should return 404 if the pool is not found", async () => {
    const req = new NextRequest(
      `https://mock-api.com/api/pair?id=${mockPoolId}`,
    );

    mockRequest.mockRejectedValueOnce(
      new NotFoundError(`Pool with ID: ${mockPoolId} not found`),
    );
    const res = await GET(req);
    expect(res.status).toBe(404);

    const jsonResponse = await res.json();
    console.log(jsonResponse);
    expect(jsonResponse).toEqual({
      error: `Pool with ID: ${mockPoolId} not found`,
    });
  });

  it("should return 500 if there is an error fetching pool data", async () => {
    mockRequest.mockRejectedValueOnce(new Error("Network error"));

    const req = new NextRequest(
      `https://mock-api.com/api/pair?id=${mockPoolId}`,
    );
    const res = await GET(req);

    expect(res.status).toBe(500);
    const jsonResponse = await res.json();
    expect(jsonResponse).toEqual({
      error: "An unexpected error occurred while fetching pair data",
    });
  });

  it("should return 200 with transformed pool data", async () => {
    const req = new NextRequest(
      `https://mock-api.com/api/pair?id=${mockPoolId}`,
    );

    const mockPoolResponse = {poolById: mockPoolData};

    mockRequest.mockResolvedValueOnce(mockPoolResponse);

    const response = await GET(req);
    expect(response.status).toBe(200);

    const jsonResponse = await response.json();

    expect(jsonResponse).toEqual(mockPairData);

    expect(mockRequest).toHaveBeenCalledWith({
      url: SQDIndexerUrl,
      document: "dummy_pool_query",
      variables: {id: mockPoolId},
    });
  });
});
