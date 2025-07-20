import assert from "node:assert/strict";
import {afterEach, beforeEach, describe, it} from "node:test";
import type {INestApplication} from "@nestjs/common";
import {Test} from "@nestjs/testing";
import supertest, {type Agent} from "supertest";
import {AppModule} from "../app.module.js";

describe("e2e", () => {
  let app: INestApplication;
  let server: Agent;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication();
    await app.init();
    server = supertest(app.getHttpServer());
  });

  afterEach(async () => {
    await app.close();
  });

  it("GET /amm/id", async () => {
    const response = await server.get("/amm/id");
    assert.strictEqual(response.status, 200);
    assert.strictEqual(
      response.text,
      "0x2E40F2b244B98ed6B8204B3De0156C6961f98525c8162f80162fCF53EEBd90E7"
    );
  });

  it("GET /amm/metadata", async () => {
    const response = await server.get("/amm/metadata");
    assert.strictEqual(response.status, 200);
  });
});
