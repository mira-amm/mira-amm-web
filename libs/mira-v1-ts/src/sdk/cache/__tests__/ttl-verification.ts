import {BN} from "fuels";
import {PoolDataCache} from "../pool-data-cache";
import {PoolId, PoolMetadata} from "../../model";

// TTL verification script
async function runTTLVerification() {
  console.log("⏰ Starting TTL expiration verification...\n");

  // Create cache instance with short TTL for testing
  const cache = new PoolDataCache({defaultTTL: 100}); // 100ms
  console.log("✅ Cache instance created with 100ms TTL");

  // Create mock pool data
  const mockPoolId: PoolId = [
    {bits: "asset1"} as any,
    {bits: "asset2"} as any,
    false,
  ];

  const mockPoolMetadata: PoolMetadata = {
    poolId: mockPoolId,
    reserve0: new BN(1000),
    reserve1: new BN(2000),
    liquidity: [{bits: "liquidity-asset"} as any, new BN(500)],
    decimals0: 9,
    decimals1: 9,
  };

  // Test 1: Store data and verify it's not stale initially
  cache.setPoolMetadata(mockPoolId, mockPoolMetadata);
  if (!cache.isStale(mockPoolId)) {
    console.log("✅ Fresh data correctly identified as not stale");
  } else {
    console.log("❌ Fresh data incorrectly identified as stale");
    return;
  }

  // Test 2: Verify data is accessible before expiration
  const retrieved = cache.getPoolMetadata(mockPoolId);
  if (retrieved) {
    console.log("✅ Data accessible before expiration");
  } else {
    console.log("❌ Data not accessible before expiration");
    return;
  }

  // Test 3: Wait for expiration and verify staleness
  console.log("⏳ Waiting for TTL expiration (150ms)...");
  await new Promise((resolve) => setTimeout(resolve, 150));

  if (cache.isStale(mockPoolId)) {
    console.log("✅ Expired data correctly identified as stale");
  } else {
    console.log("❌ Expired data not identified as stale");
    return;
  }

  // Test 4: Verify expired data returns null
  const expiredRetrieved = cache.getPoolMetadata(mockPoolId);
  if (expiredRetrieved === null) {
    console.log("✅ Expired data correctly returns null");
  } else {
    console.log("❌ Expired data still accessible");
    return;
  }

  // Test 5: Test custom TTL
  cache.setPoolMetadata(mockPoolId, mockPoolMetadata, 200); // 200ms custom TTL
  const customTTLRetrieved = cache.getPoolMetadata(mockPoolId);
  if (customTTLRetrieved && customTTLRetrieved.ttl === 200) {
    console.log("✅ Custom TTL correctly applied");
  } else {
    console.log(
      `❌ Custom TTL not applied correctly: ${customTTLRetrieved?.ttl}`
    );
    return;
  }

  console.log("\n🎉 All TTL verification tests passed!");
  console.log("⏰ TTL-based expiration is working correctly");
}

// Run verification
runTTLVerification().catch(console.error);
