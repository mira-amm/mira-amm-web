import {describe, it, expect, beforeAll, afterAll} from "vitest";
import {BN, WalletUnlocked} from "fuels";
import {MiraAmmV2} from "../../src/sdk/mira_amm_v2";
import {ReadonlyMiraAmmV2} from "../../src/sdk/readonly_mira_amm_v2";
import {testEnvironment} from "./setup/test-environment";
import {TokenFactory} from "./setup/token-factory";
import {PoolFactory, STANDARD_POOL_CONFIGS} from "./setup";

describe("V2 Add Bin Liquidity - Integration", () => {
  let tokenFactory: TokenFactory;
  let poolFactory: PoolFactory;
  let miraAmm: MiraAmmV2;
  let readonlyAmm: ReadonlyMiraAmmV2;
  let lpWallet: WalletUnlocked;

  beforeAll(async () => {
    await testEnvironment.start();

    const wallet = await testEnvironment.createWallet("100000000000000000"); // 0.1 ETH
    const contractIds = testEnvironment.getContractIds();

    tokenFactory = new TokenFactory(wallet, contractIds.fungible);
    poolFactory = new PoolFactory(wallet, contractIds.simpleProxy);

    miraAmm = new MiraAmmV2(wallet, contractIds.simpleProxy);
    readonlyAmm = new ReadonlyMiraAmmV2(
      wallet.provider,
      contractIds.simpleProxy
    );
    lpWallet = wallet;
  }, 120000);

  afterAll(async () => {
    await testEnvironment.stop();
  });

  it("adds liquidity to a specific bin (offset from active) and increases its reserves", async () => {
    const usdc = tokenFactory.getToken("USDC");
    const fuel = tokenFactory.getToken("FUEL");
    if (!usdc || !fuel) {
      throw new Error("Required test tokens not available");
    }

    // Allow overriding poolId from environment to use an existing pool
    const override = process.env.V2_POOL_ID_OVERRIDE;
    const poolId = override
      ? new BN(override)
      : await poolFactory.createPool({
          tokenX: usdc,
          tokenY: fuel,
          binStep: STANDARD_POOL_CONFIGS.VOLATILE.binStep,
          baseFactor: STANDARD_POOL_CONFIGS.VOLATILE.baseFactor,
          protocolShare: STANDARD_POOL_CONFIGS.VOLATILE.protocolShare,
        });
    if (override) {
      console.log(`🔧 Using overridden v2 pool ID: ${poolId.toString()}`);
    }

    // Determine target bin: one bin above the active price
    let activeBinId = await readonlyAmm.getActiveBin(poolId);
    if (activeBinId === null) {
      // Fall back to center bin if not yet readable
      activeBinId = 8388608;
    }
    const targetBinId = activeBinId + 1;
    const deltaId = targetBinId - activeBinId; // positive offset

    // Capture pre-state for the target bin
    const beforeLiquidity = await readonlyAmm.getBinLiquidity(
      poolId,
      targetBinId
    );

    // Prepare liquidity amounts and fund wallet with tokens
    const {amountXBN, amountYBN} = await tokenFactory.prepareLiquidityTokens(
      lpWallet,
      "USDC",
      "FUEL",
      1000,
      10000
    );

    // 0.5% slippage mins and TAI64 deadline
    const amountXMin = amountXBN.mul(new BN(9950)).div(new BN(10000));
    const amountYMin = amountYBN.mul(new BN(9950)).div(new BN(10000));
    const TAI64_OFFSET = new BN(2).pow(new BN(62));
    const deadline = TAI64_OFFSET.add(
      new BN(Math.floor(Date.now() / 1000) + 3600)
    );

    // Add liquidity to the specific target bin using deltaIds and 100% distribution
    const {transactionRequest} = await miraAmm.addLiquidity(
      poolId,
      amountXBN,
      amountYBN,
      amountXMin,
      amountYMin,
      deadline,
      activeBinId,
      0, // idSlippage
      [{Positive: deltaId}],
      [100],
      [100],
      undefined,
      {fundTransaction: true}
    );

    const tx = await lpWallet.sendTransaction(transactionRequest);
    const result = await tx.waitForResult();
    expect(result).toBeDefined();

    // Verify the target bin's liquidity increased
    const afterLiquidity = await readonlyAmm.getBinLiquidity(
      poolId,
      targetBinId
    );
    expect(afterLiquidity).not.toBeNull();

    if (beforeLiquidity) {
      // Compare X and Y reserves; at least one should increase
      const xIncreased = afterLiquidity!.x.gt(beforeLiquidity.x);
      const yIncreased = afterLiquidity!.y.gt(beforeLiquidity.y);
      expect(xIncreased || yIncreased).toBe(true);
    } else {
      // Previously empty bin should now have some liquidity
      const hasLiquidity = afterLiquidity!.x.gt(0) || afterLiquidity!.y.gt(0);
      expect(hasLiquidity).toBe(true);
    }
  }, 180000);
});
