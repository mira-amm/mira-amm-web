/**
 * Example demonstrating how to use MockDataGenerator for creating realistic pool scenarios
 */

import {BN} from "fuels";
import {MockDataGenerator} from "../MockDataGenerator";
import {MockStateManager} from "../MockStateManager";

// Example 1: Create a concentrated ETH/USDC pool
export function createConcentratedEthUsdcPool() {
  const scenario = MockDataGenerator.createEthUsdcPoolScenario("concentrated");

  console.log("Created ETH/USDC pool scenario:");
  console.log(`- Name: ${scenario.name}`);
  console.log(`- Description: ${scenario.description}`);
  console.log(`- Number of bins: ${scenario.bins.length}`);
  console.log(`- Active bin ID: ${scenario.poolConfig.activeBinId}`);

  return scenario;
}

// Example 2: Create a custom pool with specific parameters
export function createCustomPool() {
  const customScenario = MockDataGenerator.createCustomPoolScenario({
    name: "My Custom ETH/USDC Pool",
    description: "A custom pool for testing specific scenarios",
    binCount: 15, // 7 bins on each side + active bin
    distributionType: "asymmetric",
    totalLiquidity: {
      assetA: new BN("50000000000000000000"), // 50 ETH
      assetB: new BN("100000000000"), // 100,000 USDC
    },
    basePrice: new BN(2500000000), // $2500 per ETH
    volume24h: new BN("25000000000"), // $25,000 daily volume
  });

  console.log("Created custom pool scenario:");
  console.log(`- Name: ${customScenario.name}`);
  console.log(`- Bins: ${customScenario.bins.length}`);
  console.log(`- Distribution: asymmetric`);

  return customScenario;
}

// Example 3: Generate realistic volume data
export function generateVolumeExample() {
  const baseVolume = new BN("100000000000"); // $100,000 daily volume
  const volumeData = MockDataGenerator.generateVolumeData(baseVolume, 24);

  console.log("Generated 24-hour volume data:");
  console.log(`- Data points: ${volumeData.length}`);
  console.log(
    `- First point: ${volumeData[0].volume.toString()} at ${volumeData[0].timestamp}`
  );
  console.log(
    `- Last point: ${volumeData[volumeData.length - 1].volume.toString()} at ${volumeData[volumeData.length - 1].timestamp}`
  );

  return volumeData;
}

// Example 4: Calculate bin prices
export function calculateBinPricesExample() {
  const basePrice = new BN(2000000000); // $2000 per ETH
  const binStep = 25; // 0.25%

  console.log("Bin price calculations:");
  for (let offset = -3; offset <= 3; offset++) {
    const price = MockDataGenerator.calculateBinPrice(
      basePrice,
      offset,
      binStep
    );
    console.log(`- Bin offset ${offset}: $${price.div(1000000).toString()}`);
  }
}

// Example 5: Use MockStateManager with predefined scenarios
export function useStateManagerWithScenarios() {
  const stateManager = new MockStateManager();

  // Load all predefined scenarios
  stateManager.loadAllPredefinedScenarios();

  const pools = stateManager.getAllPools();
  console.log(`Loaded ${pools.length} predefined pool scenarios:`);

  pools.forEach((pool) => {
    console.log(`- Pool: ${pool.poolId}`);
    console.log(
      `  Assets: ${MockDataGenerator.getAssetInfo(pool.metadata.assetA).symbol}/${MockDataGenerator.getAssetInfo(pool.metadata.assetB).symbol}`
    );
    console.log(`  Bins: ${pool.bins.size}`);
    console.log(`  Total reserves A: ${pool.totalReserves.assetA.toString()}`);
    console.log(`  Total reserves B: ${pool.totalReserves.assetB.toString()}`);
  });

  return stateManager;
}

// Example 6: Initialize with default Fuel scenarios (quick setup)
export function quickSetupExample() {
  const stateManager = new MockStateManager();

  // Quick setup with default ETH/USDC scenarios
  stateManager.initializeWithDefaultFuelScenarios();

  const pools = stateManager.getAllPools();
  console.log(
    `Quick setup complete! Loaded ${pools.length} default Fuel scenarios.`
  );

  return stateManager;
}

// Example 7: Generate price movement simulation
export function priceMovementExample() {
  const currentPrice = new BN(2000000000); // $2000
  const volatility = 0.05; // 5% volatility
  const timeSteps = 24; // 24 hours

  const priceMovements = MockDataGenerator.generatePriceMovement(
    currentPrice,
    volatility,
    timeSteps
  );

  console.log("Price movement simulation (24 hours):");
  console.log(`- Starting price: $${currentPrice.div(1000000).toString()}`);
  console.log(
    `- Ending price: $${priceMovements[priceMovements.length - 1].div(1000000).toString()}`
  );
  console.log(`- Price points: ${priceMovements.length}`);

  return priceMovements;
}

// Run all examples
export function runAllExamples() {
  console.log("=== MockDataGenerator Examples ===\n");

  console.log("1. Concentrated ETH/USDC Pool:");
  createConcentratedEthUsdcPool();
  console.log("");

  console.log("2. Custom Pool:");
  createCustomPool();
  console.log("");

  console.log("3. Volume Data:");
  generateVolumeExample();
  console.log("");

  console.log("4. Bin Prices:");
  calculateBinPricesExample();
  console.log("");

  console.log("5. State Manager with Scenarios:");
  useStateManagerWithScenarios();
  console.log("");

  console.log("6. Quick Setup:");
  quickSetupExample();
  console.log("");

  console.log("7. Price Movement:");
  priceMovementExample();
  console.log("");

  console.log("=== Examples Complete ===");
}

// Uncomment to run examples:
// runAllExamples();
