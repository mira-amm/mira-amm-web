import {
  decimalize,
  convertTAI64StringToUnixSeconds,
  convertUnixMillisecondsToUnixSeconds,
} from "./math";
import {bn, DateTime} from "fuels";

jest.mock("fuels", () => ({
  bn: {
    parseUnits: jest.fn((amount: string) => ({
      formatUnits: jest.fn(() => amount), // Mocked formatUnits returns the same string for simplicity
    })),
  },
  DateTime: {
    fromTai64: jest.fn((tai64String: string) => ({
      getTime: () => 1672531200000, // Mocked timestamp for TAI64
    })),
  },
}));

describe("Utility Functions", () => {
  describe("decimalize", () => {
    it("should correctly decimalize a number based on the asset decimals", () => {
      const mockAmount = "1000000000"; // Example amount in base units
      const assetDecimals = 6;

      const result = decimalize(mockAmount, assetDecimals);

      // Verify bn.parseUnits is called with the expected decimalized value
      expect(bn.parseUnits).toHaveBeenCalledWith("1000");
      expect(result).toBe("1000");
    });

    it("should work with number inputs and handle floating point numbers", () => {
      const mockAmount = 1500000000; // Example amount as number
      const assetDecimals = 9;

      const result = decimalize(mockAmount, assetDecimals);

      expect(bn.parseUnits).toHaveBeenCalledWith("1.5");
      expect(result).toBe("1.5");
    });
  });

  describe("convertTAI64StringToUnixSeconds", () => {
    it("should convert TAI64 string to a Unix timestamp", () => {
      const tai64String = "0x40000000000000000000000000000000"; // Example TAI64 string
      const result = convertTAI64StringToUnixSeconds(tai64String);

      // Verify DateTime.fromTai64 is called
      expect(DateTime.fromTai64).toHaveBeenCalledWith(tai64String);
      expect(result.getTime()).toBe(1672531200000); // Mocked Unix timestamp in milliseconds
    });
  });

  describe("convertUnixMillisecondsToUnixSeconds", () => {
    it("should correctly convert milliseconds to seconds", () => {
      const milliseconds = 1672531200123; // Example Unix timestamp in milliseconds
      const result = convertUnixMillisecondsToUnixSeconds(milliseconds);

      expect(result).toBe(1672531200);
    });

    it("should handle edge cases like zero", () => {
      const milliseconds = 0;
      const result = convertUnixMillisecondsToUnixSeconds(milliseconds);

      expect(result).toBe(0);
    });
  });
});
