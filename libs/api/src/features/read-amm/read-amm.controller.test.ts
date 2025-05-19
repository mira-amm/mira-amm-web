import assert from "node:assert/strict";
import {afterEach, beforeEach, describe, it, mock} from "node:test";
import {Test} from "@nestjs/testing";
import {ReadAmmController} from "../../features/read-amm/read-amm.controller.js";
import {ReadAmmService} from "../../features/read-amm/services/read-amm.service.js";

describe("ReadAmmController", () => {
  describe("getMetadata", () => {
    let controller: ReadAmmController;
    let mockReadAmmService: ReadAmmService;

    const mockResponse = {
      id: "0x2E40F2b244B98ed6B8204B3De0156C6961f98525c8162f80162fCF53EEBd90E7",
      fees: {
        lpFeeVolatile: "0x1e",
        lpFeeStable: "0x5",
        protocolFeeVolatile: "0x0",
        protocolFeeStable: "0x0",
      },
      hook: "0xa703db08d1dbf30a6cd2fef942d8dcf03f25d2254e2091ee1f97bf5fa615639e",
      totalAssets: "0x84",
      owner:
        "0x996154773397606c6c9641f81e39067b07531b1e3cd7c578394cf98c152162f1",
    };

    beforeEach(async () => {
      mockReadAmmService = {
        getMetadata: mock.fn(async () => mockResponse),
      } as unknown as ReadAmmService;

      const module = await Test.createTestingModule({
        controllers: [ReadAmmController],
        providers: [{provide: ReadAmmService, useValue: mockReadAmmService}],
      }).compile();

      controller = module.get<ReadAmmController>(ReadAmmController);
    });

    afterEach(() => {
      mock.reset();
    });

    it("should return AMM metadata object", async () => {
      const result = await controller.getMetadata();
      assert.deepStrictEqual(result, mockResponse);
    });
  });
});
