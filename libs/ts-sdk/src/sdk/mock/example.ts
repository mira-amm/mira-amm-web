/**
 * Example usage of the Mock Mira v2 SDK
 *
 * This example demonstrates how to use the mock SDK for testing and development
 * without requiring blockchain interactions.
 */

import {BN} from "fuels";
import {MockAccount, MockMiraAmmV2, MockReadonlyMiraAmmV2} from "./index";

async function exampleUsage() {
  console.log("🚀 Mock Mira v2 SDK Example");
  console.log("============================");

  // 1. Create a mock account with test balances
  const account = MockAccount.createWithTestBalances();
  console.log("✅ Created mock account with test balances");
  console.log(`   Address: ${account.address}`);
  console.log(
    `   ETH Balance: ${account.getBalance("0x0000000000000000000000000000000000000000000000000000000000000000").toString()}`
  );
  console.log(
    `   USDC Balance: ${account.getBalance("0x0000000000000000000000000000000000000000000000000000000000000001").toString()}`
  );

  // 2. Create mock SDK instances
  const mockAmm = new MockMiraAmmV2(account, {defaultFailureRate: 0}); // No errors for demo
  const mockProvider = MockReadonlyMiraAmmV2.createMockProvider();
  const readonlyAmm = new MockReadonlyMiraAmmV2(mockProvider, undefined, {
    defaultFailureRate: 0,
  });

  // Share state between write and read instances
  readonlyAmm.setStateManager(mockAmm.getStateManager());

  console.log("✅ Created mock SDK instances");

  // 3. Create a new pool
  const poolInput = {
    assetX: {
      bits: "0x0000000000000000000000000000000000000000000000000000000000000000",
    }, // ETH
    assetY: {
      bits: "0x0000000000000000000000000000000000000000000000000000000000000001",
    }, // USDC
    binStep: 25, // 0.25% per bin
    baseFactor: 5000,
  };

  const activeId = 8388608; // Standard active bin ID
  console.log("🏗️  Creating new pool...");

  const createResult = await mockAmm.createPool(poolInput, activeId);
  console.log(
    `✅ Pool created successfully! Transaction ID: ${createResult.result?.transactionId}`
  );

  // Get the created pool ID
  const stateManager = mockAmm.getStateManager();
  const allPools = stateManager.getAllPools();
  const createdPoolId = new BN(allPools[0].poolId);
  console.log(`   Pool ID: ${createdPoolId.toString()}`);

  // 4. Query pool metadata
  const metadata = await readonlyAmm.poolMetadata(createdPoolId);
  console.log("📊 Pool Metadata:");
  console.log(`   Asset X: ${metadata?.pool.asset_x.bits}`);
  console.log(`   Asset Y: ${metadata?.pool.asset_y.bits}`);
  console.log(`   Bin Step: ${metadata?.pool.bin_step}`);
  console.log(`   Active Bin: ${metadata?.activeId}`);

  // 5. Add liquidity to the pool
  const amountA = new BN("1000000000000000000"); // 1 ETH
  const amountB = new BN("2000000000"); // 2000 USDC
  const deadline = new BN(Date.now() + 20 * 60 * 1000); // 20 minutes from now

  console.log("💰 Adding liquidity...");
  console.log(`   Amount A (ETH): ${amountA.toString()}`);
  console.log(`   Amount B (USDC): ${amountB.toString()}`);

  const addLiquidityResult = await mockAmm.addLiquidity(
    createdPoolId,
    amountA,
    amountB,
    amountA.mul(95).div(100), // 5% slippage tolerance
    amountB.mul(95).div(100), // 5% slippage tolerance
    deadline,
    activeId
  );

  console.log(
    `✅ Liquidity added! Transaction ID: ${addLiquidityResult.result?.transactionId}`
  );

  // Check updated balances
  const newEthBalance = account.getBalance(
    "0x0000000000000000000000000000000000000000000000000000000000000000"
  );
  const newUsdcBalance = account.getBalance(
    "0x0000000000000000000000000000000000000000000000000000000000000001"
  );
  console.log("📈 Updated balances:");
  console.log(`   ETH Balance: ${newEthBalance.toString()}`);
  console.log(`   USDC Balance: ${newUsdcBalance.toString()}`);

  // 6. Query user position
  const userPosition = stateManager.getUserPosition(
    account.address,
    createdPoolId
  );
  console.log("🎯 User Position:");
  console.log(
    `   Total Bin Positions: ${userPosition?.binPositions.size || 0}`
  );
  console.log(
    `   Total Value A: ${userPosition?.totalValue.assetA.toString() || "0"}`
  );
  console.log(
    `   Total Value B: ${userPosition?.totalValue.assetB.toString() || "0"}`
  );

  // 7. Query bin liquidity
  const binLiquidity = await readonlyAmm.getBinLiquidity(
    createdPoolId,
    activeId
  );
  console.log("🪣 Active Bin Liquidity:");
  console.log(`   Token X: ${binLiquidity?.x.toString() || "0"}`);
  console.log(`   Token Y: ${binLiquidity?.y.toString() || "0"}`);

  // 8. Preview a swap
  const swapAmountIn = new BN("100000000000000000"); // 0.1 ETH
  console.log(`🔄 Previewing swap of ${swapAmountIn.toString()} ETH...`);

  const swapPreview = await readonlyAmm.previewSwapExactInput(
    poolInput.assetX,
    swapAmountIn,
    [createdPoolId]
  );

  console.log(`   Expected output: ${swapPreview[1].toString()} USDC`);

  // 9. Execute the swap
  console.log("🔄 Executing swap...");
  const swapResult = await mockAmm.swapExactInput(
    swapAmountIn,
    poolInput.assetX,
    new BN("0"), // Accept any amount out for demo
    [createdPoolId],
    deadline
  );

  console.log(
    `✅ Swap completed! Transaction ID: ${swapResult.result?.transactionId}`
  );

  // Final balances
  const finalEthBalance = account.getBalance(
    "0x0000000000000000000000000000000000000000000000000000000000000000"
  );
  const finalUsdcBalance = account.getBalance(
    "0x0000000000000000000000000000000000000000000000000000000000000001"
  );
  console.log("🏁 Final balances:");
  console.log(`   ETH Balance: ${finalEthBalance.toString()}`);
  console.log(`   USDC Balance: ${finalUsdcBalance.toString()}`);

  // 10. View transaction history
  const transactions = stateManager.getAllTransactions(5);
  console.log(`📜 Recent Transactions (${transactions.length}):`);
  transactions.forEach((tx, index) => {
    console.log(
      `   ${index + 1}. ${tx.type} - ${tx.result.success ? "✅" : "❌"} - ${tx.id}`
    );
  });

  console.log("\n🎉 Mock SDK example completed successfully!");
}

// Run the example if this file is executed directly
if (require.main === module) {
  exampleUsage().catch(console.error);
}

export {exampleUsage};
