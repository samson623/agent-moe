/**
 * GET /api/ai/route-test
 *
 * Model router verification endpoint.
 * Tests the routing decisions for all job types and returns a summary.
 * Used during development and deployment to verify routing is working correctly.
 *
 * Returns routing decisions for every JobType enum value.
 * No API calls are made — pure deterministic routing logic.
 *
 * Example response:
 * {
 *   routingTable: [
 *     { jobType: "content_generation", model: "claude" },
 *     { jobType: "topic_scoring", model: "gpt5_nano" },
 *     ...
 *   ],
 *   summary: {
 *     totalJobs: 26,
 *     claudeJobs: 16,
 *     nanoJobs: 10,
 *     claudePercentage: 62
 *   },
 *   config: { costThresholdUsd: 0.001, ... },
 *   timestamp: "2026-03-08T..."
 * }
 */

import { NextResponse } from "next/server";
import { getModelRouter } from "@/features/ai/model-router";
import { JobType, ModelChoice } from "@/features/ai/types";

export const dynamic = "force-dynamic";

export async function GET(): Promise<NextResponse> {
  try {
    const router = getModelRouter();

    // Get routing decisions for all job types
    const routingTable = router.getRoutingTable();

    // Build summary statistics
    const claudeJobs = routingTable.filter((r) => r.model === ModelChoice.CLAUDE);
    const nanoJobs = routingTable.filter((r) => r.model === ModelChoice.GPT5_NANO);

    const summary = {
      totalJobs: routingTable.length,
      claudeJobs: claudeJobs.length,
      nanoJobs: nanoJobs.length,
      claudePercentage: Math.round((claudeJobs.length / routingTable.length) * 100),
    };

    // Run a few spot-check assertions for verification
    const spotChecks = [
      {
        jobType: JobType.CONTENT_GENERATION,
        expected: ModelChoice.CLAUDE,
        actual: router.route(JobType.CONTENT_GENERATION),
        pass: router.route(JobType.CONTENT_GENERATION) === ModelChoice.CLAUDE,
      },
      {
        jobType: JobType.TOPIC_SCORING,
        expected: ModelChoice.GPT5_NANO,
        actual: router.route(JobType.TOPIC_SCORING),
        pass: router.route(JobType.TOPIC_SCORING) === ModelChoice.GPT5_NANO,
      },
      {
        jobType: JobType.MISSION_PLANNING,
        expected: ModelChoice.CLAUDE,
        actual: router.route(JobType.MISSION_PLANNING),
        pass: router.route(JobType.MISSION_PLANNING) === ModelChoice.CLAUDE,
      },
      {
        jobType: JobType.SAFETY_REVIEW,
        expected: ModelChoice.CLAUDE,
        actual: router.route(JobType.SAFETY_REVIEW),
        pass: router.route(JobType.SAFETY_REVIEW) === ModelChoice.CLAUDE,
      },
      {
        jobType: JobType.TAG_ASSIGNMENT,
        expected: ModelChoice.GPT5_NANO,
        actual: router.route(JobType.TAG_ASSIGNMENT),
        pass: router.route(JobType.TAG_ASSIGNMENT) === ModelChoice.GPT5_NANO,
      },
      {
        jobType: JobType.CONTENT_FORMATTING,
        expected: ModelChoice.GPT5_NANO,
        actual: router.route(JobType.CONTENT_FORMATTING),
        pass: router.route(JobType.CONTENT_FORMATTING) === ModelChoice.GPT5_NANO,
      },
      {
        jobType: JobType.RESEARCH,
        expected: ModelChoice.CLAUDE,
        actual: router.route(JobType.RESEARCH),
        pass: router.route(JobType.RESEARCH) === ModelChoice.CLAUDE,
      },
      {
        jobType: JobType.STATUS_SUMMARY,
        expected: ModelChoice.GPT5_NANO,
        actual: router.route(JobType.STATUS_SUMMARY),
        pass: router.route(JobType.STATUS_SUMMARY) === ModelChoice.GPT5_NANO,
      },
      // Tool use should always route to Claude
      {
        jobType: JobType.TOPIC_SCORING,
        requiresTools: true,
        expected: ModelChoice.CLAUDE,
        actual: router.getModelForJob({
          type: JobType.TOPIC_SCORING,
          requiresTools: true,
        }),
        pass:
          router.getModelForJob({
            type: JobType.TOPIC_SCORING,
            requiresTools: true,
          }) === ModelChoice.CLAUDE,
        note: "Tool use overrides Nano routing",
      },
      // Web access should always route to Claude
      {
        jobType: JobType.TAG_ASSIGNMENT,
        requiresWebAccess: true,
        expected: ModelChoice.CLAUDE,
        actual: router.getModelForJob({
          type: JobType.TAG_ASSIGNMENT,
          requiresWebAccess: true,
        }),
        pass:
          router.getModelForJob({
            type: JobType.TAG_ASSIGNMENT,
            requiresWebAccess: true,
          }) === ModelChoice.CLAUDE,
        note: "Web access overrides Nano routing",
      },
    ];

    const allSpotChecksPassed = spotChecks.every((c) => c.pass);

    return NextResponse.json({
      routingTable,
      summary,
      spotChecks,
      allSpotChecksPassed,
      config: router.getConfigSummary(),
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[API /ai/route-test] Error", err);

    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Route test failed",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
