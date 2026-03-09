/**
 * Operator Factory — Creates and Manages Operator Instances
 *
 * The factory is the single point of truth for operator instantiation.
 * It ensures each operator team is a singleton within a server process —
 * no redundant client creation, no duplicate logging.
 *
 * Usage:
 *   const operator = OperatorFactory.create(OperatorTeam.CONTENT_STRIKE);
 *   const result = await operator.execute(job);
 *
 *   // Or get all operators for a pipeline
 *   const operators = OperatorFactory.createAll();
 */

import { OperatorTeam } from "@/features/ai/types";
import { BaseOperator } from "@/features/ai/operators/base-operator";
import { ContentStrikeOperator } from "@/features/ai/operators/content-strike-operator";
import { GrowthOperator } from "@/features/ai/operators/growth-operator";
import { RevenueCloserOperator } from "@/features/ai/operators/revenue-closer-operator";
import { BrandGuardianOperator } from "@/features/ai/operators/brand-guardian-operator";

// ---------------------------------------------------------------------------
// Singleton cache — operators are stateless but their clients are shared
// ---------------------------------------------------------------------------

const _operatorCache = new Map<OperatorTeam, BaseOperator>();

// ---------------------------------------------------------------------------
// OperatorFactory
// ---------------------------------------------------------------------------

export class OperatorFactory {
  /**
   * Create (or retrieve cached) operator for a given team.
   *
   * Operators are cached as singletons because:
   * 1. They hold references to shared Claude + OpenAI clients
   * 2. Construction triggers logging — we don't want noise on every call
   * 3. Stateless by design — safe to share across requests
   */
  static create(team: OperatorTeam): BaseOperator {
    const cached = _operatorCache.get(team);
    if (cached) return cached;

    const operator = OperatorFactory.instantiate(team);
    _operatorCache.set(team, operator);
    return operator;
  }

  /**
   * Create all four operators and return as a team record.
   * Used when the execution pipeline needs access to all operators.
   */
  static createAll(): Record<OperatorTeam, BaseOperator> {
    return {
      [OperatorTeam.CONTENT_STRIKE]: OperatorFactory.create(OperatorTeam.CONTENT_STRIKE),
      [OperatorTeam.GROWTH_OPERATOR]: OperatorFactory.create(OperatorTeam.GROWTH_OPERATOR),
      [OperatorTeam.REVENUE_CLOSER]: OperatorFactory.create(OperatorTeam.REVENUE_CLOSER),
      [OperatorTeam.BRAND_GUARDIAN]: OperatorFactory.create(OperatorTeam.BRAND_GUARDIAN),
    };
  }

  /**
   * Get the operator responsible for a specific team without caching.
   * Used in tests where fresh instances are needed.
   */
  static createFresh(team: OperatorTeam): BaseOperator {
    return OperatorFactory.instantiate(team);
  }

  /**
   * Clear the singleton cache.
   * Useful in tests and development hot-reload scenarios.
   */
  static clearCache(): void {
    _operatorCache.clear();
  }

  /**
   * Check if all operators are cached and ready.
   */
  static isFullyInitialized(): boolean {
    return Object.values(OperatorTeam).every((team) =>
      _operatorCache.has(team as OperatorTeam)
    );
  }

  /**
   * Get a summary of which operators are initialized.
   */
  static getInitializationStatus(): Record<OperatorTeam, boolean> {
    return {
      [OperatorTeam.CONTENT_STRIKE]: _operatorCache.has(OperatorTeam.CONTENT_STRIKE),
      [OperatorTeam.GROWTH_OPERATOR]: _operatorCache.has(OperatorTeam.GROWTH_OPERATOR),
      [OperatorTeam.REVENUE_CLOSER]: _operatorCache.has(OperatorTeam.REVENUE_CLOSER),
      [OperatorTeam.BRAND_GUARDIAN]: _operatorCache.has(OperatorTeam.BRAND_GUARDIAN),
    };
  }

  // ---------------------------------------------------------------------------
  // Private
  // ---------------------------------------------------------------------------

  private static instantiate(team: OperatorTeam): BaseOperator {
    switch (team) {
      case OperatorTeam.CONTENT_STRIKE:
        return new ContentStrikeOperator();

      case OperatorTeam.GROWTH_OPERATOR:
        return new GrowthOperator();

      case OperatorTeam.REVENUE_CLOSER:
        return new RevenueCloserOperator();

      case OperatorTeam.BRAND_GUARDIAN:
        return new BrandGuardianOperator();

      default: {
        // TypeScript exhaustiveness check — should never reach here
        const _exhaustive: never = team;
        throw new Error(`Unknown operator team: ${String(_exhaustive)}`);
      }
    }
  }
}
