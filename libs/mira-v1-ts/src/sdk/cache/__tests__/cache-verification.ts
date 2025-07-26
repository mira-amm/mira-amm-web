import {BN} from "fuels";
import {PoolDataCache, generatePoolCacheKey} from "../pool-data-cache";
import {PoolId, PoolMetadata} from "../../model";

// Simple verification script to test cache functionality
function runCacheVerification() {
  console.log("🧪 Starting Pool Data Cache verification...\n");

  // Create cache instance
  const cache = new PoolDataCache();
  console.log("✅ Cache instance created");

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

  // Test 1: Cache key generation
  const cacheKey = generatePoolCacheKey(mockPoolId);
  console.log(`✅ Cache key generated: ${cacheKey}`);

  // Test 2: Store and retrieve
  cache.setPoolMetadata(mockPoolId, mockPoolMetadata);
  const retrieved = cache.getPoolMetadata(mockPoolId);

  if (retrieved && retrieved.poolId === mockPoolMetadata.poolId) {
    console.log("✅ Store and retrieve working correctly");
  } else {
    console.log("❌ Store and retrieve failed");
    return;
  }

  // Test 3: Cache metadata
  if (retrieved.fetchedAt && retrieved.ttl && retrieved.refreshCount === 0) {
    console.log("✅ Cache metadata correctly attached");
  } else {
    console.log("❌ Cache metadata missing or incorrect");
    return;
  }

  // Test 4: Cache miss
  const nonExistentPoolId: PoolId = [
    {bits: "nonexistent1"} as any,
    {bits: "nonexistent2"} as any,
    false,
  ];

  const missResult = cache.getPoolMetadata(nonExistentPoolId);
  if (missResult === null) {
    console.log("✅ Cache miss handled correctly");
  } else {
    console.log("❌ Cache miss not handled correctly");
    return;
  }

  // Test 5: Statistics
  const stats = cache.getStats();
  if (stats.hits === 1 && stats.misses === 1 && stats.totalRequests === 2) {
    console.log("✅ Statistics tracking working correctly");
  } else {
    console.log(
      `❌ Statistics incorrect: hits=${stats.hits}, misses=${stats.misses}, total=${stats.totalRequests}`
    );
    return;
  }

  // Test 6: Hit rate calculation
  const hitRate = cache.getHitRate();
  if (hitRate === 50) {
    console.log("✅ Hit rate calculation correct (50%)");
  } else {
    console.log(`❌ Hit rate calculation incorrect: ${hitRate}%`);
    return;
  }

  // Test 7: Cache size and management
  if (cache.size() === 1) {
    console.log("✅ Cache size tracking correct");
  } else {
    console.log(`❌ Cache size incorrect: ${cache.size()}`);
    return;
  }

  // Test 8: Valid cache check
  if (
    cache.hasValidCache(mockPoolId) &&
    !cache.hasValidCache(nonExistentPoolId)
  ) {
    console.log("✅ Valid cache check working correctly");
  } else {
    console.log("❌ Valid cache check failed");
    return;
  }

  // Test 9: Refresh count
  cache.setPoolMetadata(mockPoolId, mockPoolMetadata); // Update same pool
  const refreshed = cache.getPoolMetadata(mockPoolId);
  if (refreshed && refreshed.refreshCount === 1) {
    console.log("✅ Refresh count tracking working correctly");
  } else {
    console.log(`❌ Refresh count incorrect: ${refreshed?.refreshCount}`);
    return;
  }

  // Test 10: Clear cache
  cache.clear();
  if (cache.size() === 0 && cache.getPoolMetadata(mockPoolId) === null) {
    console.log("✅ Cache clear working correctly");
  } else {
    console.log("❌ Cache clear failed");
    return;
  }

  console.log("\n🎉 All cache verification tests passed!");
  console.log("📊 Cache infrastructure is ready for integration");
}

// Run verification
runCacheVerification();

export {runCacheVerification};
