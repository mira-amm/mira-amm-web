import {BigNumberish, Provider} from "fuels";

export async function futureDeadline(
  provider: Provider
): Promise<BigNumberish> {
  const block = await provider.getBlock("latest");
  return block?.height.add(1000) ?? 1000000000;
}
