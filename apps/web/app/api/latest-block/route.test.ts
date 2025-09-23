import {describe, it, expect} from "vitest";
import {NextRequest} from "next/server";
import {GET} from "./route";

describe("GET /api/latest-block (integration)", () => {
  it("returns a valid block number and a recent timestamp", async () => {
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
