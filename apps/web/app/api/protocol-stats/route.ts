import {NextResponse} from "next/server";
import {statsService} from "@/web/src/core/stats-service";
import type {ProtocolStatsData} from "@/web/src/types/protocol-stats";

/**
 * API route for fetching protocol statistics with 5-minute server-side caching
 * Uses existing fetchProtocolStats logic with simple cache control headers
 */
export async function GET(): Promise<NextResponse> {
  try {
    // Fetch protocol stats using existing logic
    const stats: ProtocolStatsData = await statsService.fetchProtocolStats();

    // Create response with protocol stats data
    const response = NextResponse.json(stats, {
      status: 200,
      headers: {
        // 5-minute server-side caching as specified in requirements
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        "CDN-Cache-Control": "public, s-maxage=300",
        "Vercel-CDN-Cache-Control": "public, s-maxage=300",
        // CORS headers for cross-origin requests
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });

    return response;
  } catch (error) {
    console.error("Protocol stats API error:", error);

    // Return error response with appropriate status code
    return NextResponse.json(
      {
        error: "Failed to fetch protocol statistics",
        message:
          error instanceof Error ? error.message : "Unknown error occurred",
      },
      {
        status: 500,
        headers: {
          // No caching for error responses to allow quick retry
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      }
    );
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
