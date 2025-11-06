/**
 * CoinMarketCap Asset ID Mapping Utility
 * Fetches and caches the mapping of asset symbols to CMC Unified Cryptoasset IDs
 *
 * Uses CMC's public UNIFIED-CRYPTOASSET-INDEX endpoint (no API key required)
 */

interface CMCAsset {
  id: number;
  rank: number;
  name: string;
  symbol: string;
  slug: string;
  is_active: number;
}

interface CMCMapResponse {
  data: CMCAsset[];
}

// In-memory cache for asset mappings
let cachedAssetMap: Record<string, string> | null = null;
let cacheTimestamp: number | null = null;

// Cache duration: 24 hours (CMC data doesn't change frequently)
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000;

/**
 * Fetches the latest CMC asset mappings from their public API
 * Uses the UNIFIED-CRYPTOASSET-INDEX for public access (no API key needed)
 */
async function fetchCMCAssetMap(): Promise<Record<string, string>> {
  try {
    const response = await fetch(
      "https://pro-api.coinmarketcap.com/v1/cryptocurrency/map?CMC_PRO_API_KEY=UNIFIED-CRYPTOASSET-INDEX&listing_status=active",
      {
        headers: {
          Accept: "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`CMC API error: ${response.status}`);
    }

    const data: CMCMapResponse = await response.json();

    // Build symbol -> ID mapping (API already returns only active assets)
    const assetMap: Record<string, string> = {};
    data.data.forEach((asset) => {
      assetMap[asset.symbol] = asset.id.toString();
    });

    console.log(`Loaded ${Object.keys(assetMap).length} CMC asset mappings`);
    return assetMap;
  } catch (error) {
    console.error("Failed to fetch CMC asset map:", error);
    // Return empty map - endpoints will use null for unknown assets
    return {};
  }
}

/**
 * Gets the CMC asset ID mapping with caching
 * Returns cached data if available and not expired, otherwise fetches fresh data
 */
export async function getCMCAssetMap(): Promise<Record<string, string>> {
  const now = Date.now();

  // Return cached data if available and not expired
  if (
    cachedAssetMap &&
    cacheTimestamp &&
    now - cacheTimestamp < CACHE_DURATION_MS
  ) {
    return cachedAssetMap;
  }

  // Fetch fresh data
  const assetMap = await fetchCMCAssetMap();

  // Update cache
  cachedAssetMap = assetMap;
  cacheTimestamp = now;

  return assetMap;
}

/**
 * Gets the CMC asset ID for a given symbol
 * Returns null if symbol not found in CMC database
 */
export async function getCMCAssetId(symbol: string): Promise<string | null> {
  const assetMap = await getCMCAssetMap();
  return assetMap[symbol] || null;
}

/**
 * Clears the cache (useful for testing or manual refresh)
 */
export function clearCMCAssetCache(): void {
  cachedAssetMap = null;
  cacheTimestamp = null;
}
