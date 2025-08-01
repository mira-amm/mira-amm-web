import {NextRequest, NextResponse} from "next/server";
import {statsService} from "@/web/src/core/stats-service";
import {
  createCacheHeaders,
  backgroundRefreshManager,
} from "@/web/src/core/background-refresh";
import type {ProtocolStatsData} from "@/web/src/types/protocol-stats";

/**
 * API route for fetching protocol statistics with server-side caching
 * Implements stale-while-revalidate pattern for optimal performance
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Fetch protocol stats using our simplified caching system
    const stats: ProtocolStatsData = await statsService.fetchProtocolStats();

    // Create response with protocol stats data
    const response = NextResponse.json({
      success: true,
      data: stats,
      lastUpdated: new Date().toISOString(),
      cached: true, // Indicates data comes from our axios cache
    });

    // Set enhanced caching headers for optimal performance
    const cacheHeaders = createCacheHeaders({
      maxAge: 60, // Cache for 1 minute
      staleWhileRevalidate: 300, // Serve stale for 5 minutes while revalidating
      mustRevalidate: false, // Allow stale data for better UX
    });

    // Apply cache headers
    Object.entries(cacheHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    // Add CORS headers for cross-origin requests
    response.headers.set("Access-Control-Allow-Origin", "*");
    response.headers.set("Access-Control-Allow-Methods", "GET");
    response.headers.set("Access-Control-Allow-Headers", "Content-Type");

    // Trigger background refresh if needed
    const refreshStatus = backgroundRefreshManager.getStatus();
    if (!refreshStatus.isRunning) {
      // Start background refresh on first API call
      console.log("API: Starting background refresh manager");
      backgroundRefreshManager.startBackgroundRefresh();
    }

    return response;
  } catch (error) {
    console.error("Protocol stats API error:", error);

    // Return error response with appropriate status
    const errorResponse = NextResponse.json(
      {
        success: false,
        error: "Failed to fetch protocol statistics",
        message:
          error instanceof Error ? error.message : "Unknown error occurred",
        lastUpdated: new Date().toISOString(),
      },
      {status: 500}
    );

    // Set minimal cache for error responses to allow quick retry
    errorResponse.headers.set(
      "Cache-Control",
      "no-cache, no-store, must-revalidate"
    );

    return errorResponse;
  }
}

/**
 * Handle OPTIONS requests for CORS preflight
 */
export async function OPTIONS(): Promise<NextResponse> {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
