import {describe, it, expect} from "vitest";
import {NextRequest} from "next/server";
import {GET} from "./route";

describe("GET /api/latest-block (integration)", () => {
  /**
   * This test is expected to fail while the subsquid indexer is lagging behind so far.
   * If it suddenly passes, that means the indexer is back online
   * and we should remove `test.fails` so it becomes a normal test again.
   */
  it.fails("returns a valid block number and a recent timestamp", async () => {
    const req = new NextRequest("http://localhost/api/latest-block");
    const res = await GET(req);

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toHaveProperty("block");
    expect(typeof json.block.blockNumber).toBe("number");
    expect(typeof json.block.blockTimestamp).toBe("number");

    expect(json.block.blockNumber).toBeGreaterThan(0);

    const now = Math.floor(Date.now() / 1000);
    expect(json.block.blockTimestamp).toBeGreaterThanOrEqual(now - 300);
    expect(json.block.blockTimestamp).toBeLessThanOrEqual(now + 5);
  });
});
