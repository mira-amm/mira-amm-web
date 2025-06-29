import {vi} from "vitest";
import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  beforeEach,
  afterEach,
} from "vitest";
import {NextRequest} from "next/server";
import {NotFoundError} from "../../../../../libs/web/src/utils/errors";
import {fetchPoolById, createPairFromPool, GET} from "./route";

const INDEXER_URL = "https://mira-dex.squids.live/mira-indexer@v3/api/graphql";

const mockRequest = vi.fn();
const mockGql = vi.fn((q: string) => q.trim());

vi.mock("graphql-request", () => ({
  request: mockRequest,
  gql: mockGql,
}));

const poolId = "pool-xyz";
const rawPool = {
  id: poolId,
  asset0: {id: "0xa"},
  asset1: {id: "0xb"},
  creationBlock: 100,
  creationTime: 1_610_000_000,
  creationTx: "0xtx",
};
const expectedPair = {
  id: poolId,
  dexKey: "mira",
  asset0Id: rawPool.asset0.id,
  asset1Id: rawPool.asset1.id,
  createdAtBlockNumber: rawPool.creationBlock,
  createdAtBlockTimestamp: rawPool.creationTime,
  createdAtTxnId: rawPool.creationTx,
};

beforeAll(() => {
  // gql mock already returns trimmed query
});

afterAll(() => {
  vi.restoreAllMocks();
});

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  // no extra teardown
});

describe("fetchPoolById()", () => {
  it("sends correct GraphQL request and returns pool", async () => {
    mockRequest.mockResolvedValueOnce({poolById: rawPool});

    const result = await fetchPoolById(poolId);

    expect(mockGql).toHaveBeenCalledOnce();

    expect(mockRequest).toHaveBeenCalledWith({
      url: INDEXER_URL,
      document: mockGql.mock.results[0].value,
      variables: {id: poolId},
    });

    expect(result).toEqual(rawPool);
  });

  it("throws NotFoundError if indexer returns null", async () => {
    mockRequest.mockResolvedValueOnce({poolById: null});
    await expect(fetchPoolById(poolId)).rejects.toBeInstanceOf(NotFoundError);
  });

  it("propagates network errors", async () => {
    mockRequest.mockRejectedValueOnce(new Error("network fail"));
    await expect(fetchPoolById(poolId)).rejects.toThrow("network fail");
  });
});

describe("createPairFromPool()", () => {
  it("maps Pool → Pair correctly", () => {
    const pair = createPairFromPool(rawPool);
    expect(pair).toEqual(expectedPair);
  });
});

describe("GET /api/pair", () => {
  const baseUrl = "https://test/api/pair";
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it("400 when id param is missing", async () => {
    const res = await GET(new NextRequest(baseUrl));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({error: "Pool ID(param: id) is required"});
  });

  it("404 when fetchPoolById throws NotFoundError", async () => {
    mockRequest.mockRejectedValueOnce(new NotFoundError("no pool"));
    const res = await GET(new NextRequest(`${baseUrl}?id=${poolId}`));
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({error: "no pool"});
    expect(consoleSpy).toHaveBeenCalled();
  });

  it("500 on unexpected error", async () => {
    mockRequest.mockRejectedValueOnce(new Error("boom"));
    const res = await GET(new NextRequest(`${baseUrl}?id=${poolId}`));
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({
      error: "An unexpected error occurred while fetching pair data",
    });
    expect(consoleSpy).toHaveBeenCalled();
  });

  it("200 + correct body on success", async () => {
    mockRequest.mockResolvedValueOnce({poolById: rawPool});
    const res = await GET(new NextRequest(`${baseUrl}?id=${poolId}`));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({pair: expectedPair});
    expect(consoleSpy).not.toHaveBeenCalled();
  });
});
