import { BrandGuardianOperator } from "@/features/ai/operators/brand-guardian-operator";
import {
  JobStatus,
  JobType,
  ModelChoice,
  OperatorTeam,
  Platform,
  RiskLevel,
  type Job,
} from "@/features/ai/types";

const mockClaudeRun = jest.fn();

jest.mock("@/features/ai/claude-client", () => ({
  getClaudeClient: jest.fn(() => ({
    run: mockClaudeRun,
    healthCheck: jest.fn().mockReturnValue("ok"),
  })),
  ClaudeClient: jest.fn(),
}));

jest.mock("@/features/ai/openai-client", () => ({
  getOpenAIClient: jest.fn(() => ({
    score: jest.fn(),
    classify: jest.fn(),
    extractTags: jest.fn(),
    healthCheck: jest.fn().mockReturnValue("ok"),
  })),
  OpenAIClient: jest.fn(),
}));

jest.mock("@/features/ai/model-router", () => ({
  getModelRouter: jest.fn(() => ({
    route: jest.fn().mockReturnValue("claude"),
    getModelForJob: jest.fn().mockReturnValue("claude"),
  })),
  ModelRouter: jest.fn(),
}));

function buildSafetyReviewJob(): Job {
  return {
    id: "test-brand-guardian-job",
    missionId: "test-mission",
    type: JobType.SAFETY_REVIEW,
    operatorTeam: OperatorTeam.BRAND_GUARDIAN,
    status: JobStatus.PENDING,
    priority: 1,
    dependsOn: [],
    input: {
      kind: "safety",
      content: "Draft launch sequence copy",
      platform: Platform.X,
      brandRules: {
        allowedTone: ["professional", "direct"],
        blockedPhrases: [],
        blockedClaims: [],
        requiresDisclaimer: false,
        maxRiskLevel: RiskLevel.MEDIUM,
      },
    },
    createdAt: new Date().toISOString(),
  };
}

describe("BrandGuardianOperator - safety review normalization", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("accepts nullable revised content fields returned by Claude", async () => {
    const operator = new BrandGuardianOperator();

    mockClaudeRun.mockResolvedValueOnce({
      success: true,
      data: JSON.stringify({
        approved: true,
        riskLevel: "low",
        flags: [],
        toneScore: 0.94,
        revisedContent: null,
        revisionNotes: null,
        reviewedAt: new Date().toISOString(),
      }),
      model: ModelChoice.CLAUDE,
      jobType: JobType.SAFETY_REVIEW,
      tokensUsed: 120,
      durationMs: 250,
      timestamp: new Date().toISOString(),
    });

    const result = await operator.execute(buildSafetyReviewJob());

    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.data).toEqual(
      expect.objectContaining({
        approved: true,
        revisedContent: null,
        revisionNotes: null,
      })
    );
  });
});
