/**
 * Base Operator — Abstract Foundation for All Operator Teams
 *
 * All four operator teams (Content Strike, Growth Operator, Revenue Closer,
 * Brand Guardian) extend this class.
 *
 * Provides:
 * - Shared client instances (Claude + OpenAI)
 * - Model router access
 * - Typed logging
 * - Zod-based output validation
 * - Execution timing and result wrapping
 *
 * Operators do NOT inherit AI logic — they compose it via the clients.
 * Each operator is a specialized prompt + routing strategy, not a new AI model.
 */

import { z, type ZodSchema } from "zod";
import { ClaudeClient, getClaudeClient } from "@/features/ai/claude-client";
import { getOpenAIClient, OpenAIClient } from "@/features/ai/openai-client";
import { getModelRouter, ModelRouter } from "@/features/ai/model-router";
import {
  type AIError,
  AIErrorCode,
  type ExecutionResult,
  type Job,
  JobType,
  ModelChoice,
  type OperatorTeam,
} from "@/features/ai/types";

// ---------------------------------------------------------------------------
// Structured log entry
// ---------------------------------------------------------------------------

export interface OperatorLogEntry {
  timestamp: string;
  operator: string;
  team: OperatorTeam;
  action: string;
  jobId?: string;
  jobType?: JobType;
  model?: ModelChoice;
  durationMs?: number;
  success?: boolean;
  meta?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// BaseOperator abstract class
// ---------------------------------------------------------------------------

export abstract class BaseOperator {
  /** Which operator team this instance belongs to. */
  protected readonly team: OperatorTeam;

  /** Claude client for heavy tasks. */
  protected readonly claude: ClaudeClient;

  /** OpenAI client for light tasks. */
  protected readonly openai: OpenAIClient;

  /** Model router for routing decisions. */
  protected readonly router: ModelRouter;

  constructor(team: OperatorTeam) {
    this.team = team;
    this.claude = getClaudeClient();
    this.openai = getOpenAIClient();
    this.router = getModelRouter();
  }

  // ---------------------------------------------------------------------------
  // Abstract interface — each operator must implement these
  // ---------------------------------------------------------------------------

  /**
   * Execute a job and return a typed result.
   * Implementations should validate their output against a Zod schema.
   */
  abstract execute(job: Job): Promise<ExecutionResult<unknown>>;

  /**
   * Returns the operator's full system prompt.
   * This defines the AI's persona, expertise, and output format expectations.
   */
  abstract getSystemPrompt(): string;

  /**
   * Returns the list of job types this operator handles.
   * Used by the operator factory and router for validation.
   */
  abstract getSupportedJobTypes(): JobType[];

  // ---------------------------------------------------------------------------
  // Protected utilities
  // ---------------------------------------------------------------------------

  /**
   * Structured console logger.
   * In Phase 3, this will also write to the activity_logs Supabase table.
   *
   * Format: [OPERATOR:TEAM] action | meta
   */
  protected log(action: string, meta?: Record<string, unknown>): void {
    const entry: OperatorLogEntry = {
      timestamp: new Date().toISOString(),
      operator: this.constructor.name,
      team: this.team,
      action,
      ...(meta ?? {}),
    };

    // Structured log — easy to parse, filter, and forward to Supabase later
    console.log(
      `[${entry.operator}:${entry.team}] ${action}`,
      meta ? JSON.stringify(meta) : ""
    );
  }

  /**
   * Validate AI output against a Zod schema.
   * Throws a typed AIError (not raw Error) if validation fails.
   * Never let malformed AI output silently pass through.
   */
  protected validateOutput<T>(output: unknown, schema: ZodSchema<T>): T {
    const result = schema.safeParse(output);
    if (!result.success) {
      const errorMsg = result.error.issues
        .map((i) => `${i.path.join(".")}: ${i.message}`)
        .join("; ");

      throw Object.assign(new Error(`Schema validation failed: ${errorMsg}`), {
        code: AIErrorCode.SCHEMA_VALIDATION_FAILED,
        issues: result.error.issues,
      });
    }
    return result.data;
  }

  /**
   * Wrap any error from an operator's execute() method into a typed ExecutionResult.
   * Call this in catch blocks to ensure consistent error shape.
   */
  protected buildErrorResult(
    err: unknown,
    jobType: JobType,
    model: ModelChoice,
    start: number
  ): ExecutionResult<never> {
    const error = this.parseError(err);
    this.log("job_failed", { error: error.code, message: error.message });

    return {
      success: false,
      error,
      model,
      jobType,
      durationMs: Date.now() - start,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Parse any caught exception into a typed AIError.
   */
  protected parseError(err: unknown): AIError {
    // Zod validation failure
    if (err instanceof z.ZodError) {
      return {
        code: AIErrorCode.SCHEMA_VALIDATION_FAILED,
        message: err.issues.map((i) => i.message).join("; "),
        retryable: false,
        details: { issues: err.issues },
      };
    }

    // Error with our custom code field (from validateOutput)
    if (
      err instanceof Error &&
      "code" in err &&
      typeof (err as Record<string, unknown>)["code"] === "string"
    ) {
      return {
        code: (err as Record<string, unknown>)["code"] as AIErrorCode,
        message: err.message,
        retryable: false,
      };
    }

    if (err instanceof Error) {
      return {
        code: AIErrorCode.UPSTREAM_ERROR,
        message: err.message,
        retryable: false,
      };
    }

    return {
      code: AIErrorCode.UPSTREAM_ERROR,
      message: "Unknown error in operator",
      retryable: false,
    };
  }

  /**
   * Check if this operator supports the given job type.
   * Used defensively in execute() implementations.
   */
  protected supportsJob(jobType: JobType): boolean {
    return this.getSupportedJobTypes().includes(jobType);
  }

  /**
   * Build a typed "unsupported job" error result.
   */
  protected unsupportedJobResult(job: Job, start: number): ExecutionResult<never> {
    return {
      success: false,
      error: {
        code: AIErrorCode.UPSTREAM_ERROR,
        message: `${this.constructor.name} does not support job type: ${job.type}`,
        retryable: false,
      },
      model: ModelChoice.CLAUDE,
      jobType: job.type,
      durationMs: Date.now() - start,
      timestamp: new Date().toISOString(),
    };
  }
}
