import {BN} from "fuels";
import {PoolDataCache} from "../pool-data-cache";
import {PoolId, PoolMetadata} from "../../model";

// LRU eviction verification script
function runLRUVerification() {
  console.log("🔄 Starting LRU eviction verification...\n");

  // Create cache instance with small size for testing
  const cache = new PoolDataCache({maxSize: 3});
  console.log("✅ Cache instance created with maxSize=3");

  // Create mock pool data
  const createMockPool = (id: string): [PoolId, PoolMetadata] => {
    const poolId: PoolId = [
      {bits: `asset${id}a`} as any,
      {bits: `asset${id}b`} as any,
      false,
    ];
    const metadata: PoolMetadata = {
      poolId,
      reserve0: new BN(1000),
      reserve1: new BN(2000),
      liquidity: [{bits: `liquidity-${id}`} as any, new BN(500)],
      decimals0: 9,
      decimals1: 9,
    };
    return [poolId, metadata];
  };

  const [pool1Id, pool1Meta] = createMockPool("1");
  const [pool2Id, pool2Meta] = createMockPool("2");
  const [pool3Id, pool3Meta] = createMockPool("3");
  const [pool4Id, pool4Meta] = createMockPool("4");

  // Test 1: Fill cache to capacity
  cache.setPoolMetadata(pool1Id, pool1Meta);
  cache.setPoolMetadata(pool2Id, pool2Meta);
  cache.setPoolMetadata(pool3Id, pool3Meta);

  if (cache.size() === 3) {
    console.log("✅ Cache filled to capacity (3 pools)");
  } else {
    console.log(`❌ Cache size incorrect: ${cache.size()}`);
    return;
  }

  // Verify all pools are accessible
  if (
    cache.getPoolMetadata(pool1Id) &&
    cache.getPoolMetadata(pool2Id) &&
    cache.getPoolMetadata(pool3Id)
  ) {
    console.log("✅ All pools accessible at capacity");
  } else {
    console.log("❌ Not all pools accessible at capacity");
    return;
  }

  // Test 2: Add fourth pool, should evict first (LRU)
  cache.setPoolMetadata(pool4Id, pool4Meta);

  if (cache.size() === 3) {
    console.log("✅ Cache size maintained at 3 after eviction");
  } else {
    console.log(`❌ Cache size incorrect after eviction: ${cache.size()}`);
    return;
  }

  // Pool1 should be evicted (least recently used)
  if (cache.getPoolMetadata(pool1Id) === null) {
    console.log("✅ LRU pool (pool1) correctly evicted");
  } else {
    console.log("❌ LRU pool not evicted");
    return;
  }

  // Other pools should still be accessible
  if (
    cache.getPoolMetadata(pool2Id) &&
    cache.getPoolMetadata(pool3Id) &&
    cache.getPoolMetadata(pool4Id)
  ) {
    console.log("✅ Non-LRU pools still accessible");
  } else {
    console.log("❌ Non-LRU pools not accessible");
    return;
  }

  // Test 3: Access pool2 to make it recently used, then add pool1 back
  cache.getPoolMetadata(pool2Id); // Make pool2 recently used
  cache.setPoolMetadata(pool1Id, pool1Meta); // Add pool1 back

  // Pool3 should be evicted now (it was the LRU after pool2 was accessed)
  if (cache.getPoolMetadata(pool3Id) === null) {
    console.log("✅ LRU updated correctly after access - pool3 evicted");
  } else {
    console.log("❌ LRU not updated correctly after access");
    return;
  }

  // Pool2 should still be accessible (was recently accessed)
  if (cache.getPoolMetadata(pool2Id)) {
    console.log("✅ Recently accessed pool2 still available");
  } else {
    console.log("❌ Recently accessed pool not available");
    return;
  }

  // Test 4: Check eviction statistics
  const stats = cache.getStats();
  if (stats.evictions === 2) {
    console.log("✅ Eviction statistics correctly tracked (2 evictions)");
  } else {
    console.log(`❌ Eviction statistics incorrect: ${stats.evictions}`);
    return;
  }

  console.log("\n🎉 All LRU verification tests passed!");
  console.log("🔄 LRU eviction mechanism is working correctly");
}

// Run verification
runLRUVerification();
