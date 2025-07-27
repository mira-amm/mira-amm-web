import {BN} from "fuels";
import {powDecimals, roundingUpDivision} from "./math";

test("rounding up division", () => {
  expect(roundingUpDivision(new BN(1000), new BN(1000)).toString()).toBe("1");
  expect(roundingUpDivision(new BN(1000), new BN(1)).toString()).toBe("1000");
  expect(roundingUpDivision(new BN(1000), new BN(5)).toString()).toBe("200");
  expect(roundingUpDivision(new BN(1000), new BN(2000)).toString()).toBe("1");
  expect(roundingUpDivision(new BN(9), new BN(3)).toString()).toBe("3");
  expect(roundingUpDivision(new BN(10), new BN(3)).toString()).toBe("4");
  expect(roundingUpDivision(new BN(11), new BN(3)).toString()).toBe("4");
  expect(roundingUpDivision(new BN(12), new BN(3)).toString()).toBe("4");
  expect(roundingUpDivision(powDecimals(72), powDecimals(12)).toString()).toBe(
    powDecimals(60).toString()
  );
  expect(
    roundingUpDivision(
      powDecimals(72).add(new BN(1)),
      powDecimals(12)
    ).toString()
  ).toBe(powDecimals(60).add(new BN(1)).toString());
});
