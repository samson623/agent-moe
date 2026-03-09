/**
 * GET /api/ai/health
 *
 * AI services health check endpoint.
 * Verifies that both AI clients are configured — does NOT make real API calls.
 * Safe to call frequently (no cost, no rate limit risk).
 *
 * Returns:
 * {
 *   claude: 'ok' | 'missing_token'
 *   openai: 'ok' | 'missing_key'
 *   router: 'ok'
 *   timestamp: string (ISO 8601)
 *   summary: 'healthy' | 'degraded' | 'down'
 * }
 */

import { NextResponse } from "next/server";
import { getClaudeClient } from "@/features/ai/claude-client";
import { getOpenAIClient } from "@/features/ai/openai-client";
import { getModelRouter } from "@/features/ai/model-router";

export const dynamic = "force-dynamic"; // Never cache health checks

export async function GET(): Promise<NextResponse> {
  try {
    const claude = getClaudeClient();
    const openai = getOpenAIClient();
    const router = getModelRouter();

    const claudeStatus = claude.healthCheck();
    const openaiStatus = openai.healthCheck();
    const routerConfig = router.getConfigSummary();

    // Determine overall health
    const allOk = claudeStatus === "ok" && openaiStatus === "ok";
    const noneOk = claudeStatus !== "ok" && openaiStatus !== "ok";

    const summary: "healthy" | "degraded" | "down" = allOk
      ? "healthy"
      : noneOk
        ? "down"
        : "degraded";

    const response = {
      claude: claudeStatus,
      openai: openaiStatus,
      router: "ok" as const,
      routerConfig,
      timestamp: new Date().toISOString(),
      summary,
      notes: [
        claudeStatus === "missing_token"
          ? "CLAUDE_CODE_OAUTH_TOKEN not set — run `claude setup-token`"
          : null,
        openaiStatus === "missing_key"
          ? "OPENAI_API_KEY not set — add to .env.local"
          : null,
      ].filter(Boolean),
    };

    // Return 200 even if degraded — let the client decide what to do
    // Return 503 only if completely down
    const statusCode = summary === "down" ? 503 : 200;

    return NextResponse.json(response, { status: statusCode });
  } catch (err) {
    console.error("[API /ai/health] Unexpected error", err);

    return NextResponse.json(
      {
        claude: "error",
        openai: "error",
        router: "error",
        timestamp: new Date().toISOString(),
        summary: "down",
        error: err instanceof Error ? err.message : "Unexpected health check error",
      },
      { status: 500 }
    );
  }
}
