import { z } from "zod";

export const ammMetadata = z.object({
  id: z.literal("0x2E40F2b244B98ed6B8204B3De0156C6961f98525c8162f80162fCF53EEBd90E7"),
  fees: z.object({
    lpFeeVolatile: z.literal("0x1e"),
    lpFeeStable: z.literal("0x5"),
    protocolFeeVolatile: z.literal("0x0"),
    protocolFeeStable: z.literal("0x0"),
  }),
  hook: z.literal("0xa703db08d1dbf30a6cd2fef942d8dcf03f25d2254e2091ee1f97bf5fa615639e"),
  totalAssets: z.literal("0x84"),
  owner: z.literal("0x996154773397606c6c9641f81e39067b07531b1e3cd7c578394cf98c152162f1"),
});

export type AmmMetadata = z.infer<typeof ammMetadata>;
