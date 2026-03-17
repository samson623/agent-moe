import { GrowthOperator } from "@/features/ai/operators/growth-operator";
import {
  JobStatus,
  JobType,
  ModelChoice,
  OperatorTeam,
  Platform,
  type Job,
} from "@/features/ai/types";

const mockClaudeRun = jest.fn();

jest.mock("@/features/ai/claude-client", () => ({
  getClaudeClient: jest.fn(() => ({
    run: mockClaudeRun,
    research: jest.fn(),
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

function buildTrendJob(): Job {
  return {
    id: "test-growth-job",
    missionId: "test-mission",
    type: JobType.TREND_ANALYSIS,
    operatorTeam: OperatorTeam.GROWTH_OPERATOR,
    status: JobStatus.PENDING,
    priority: 1,
    dependsOn: [],
    input: {
      kind: "trend",
      niche: "browser agents for founders",
      platforms: [Platform.X, Platform.LINKEDIN],
      timeframe: "7d",
    },
    createdAt: new Date().toISOString(),
  };
}

describe("GrowthOperator - trend analysis normalization", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("accepts mixed-case platform labels returned by Claude", async () => {
    const operator = new GrowthOperator();

    mockClaudeRun.mockResolvedValueOnce({
      success: true,
      data: JSON.stringify({
        signals: [
          {
            topic: "Browser-agent explainer posts",
            momentumScore: 81,
            opportunityScore: 84,
            platforms: ["LinkedIn", "X/Twitter", "YouTube"],
            angle: "Show founders where browser agents remove repetitive ops work",
            competitorActivity: "medium",
            timeframe: "2-3 weeks",
            rationale: "Awareness is rising and most content is still generic.",
          },
        ],
      }),
      model: ModelChoice.CLAUDE,
      jobType: JobType.TREND_ANALYSIS,
      tokensUsed: 200,
      durationMs: 300,
      timestamp: new Date().toISOString(),
    });

    const result = await operator.execute(buildTrendJob());

    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.data).toEqual({
      signals: [
        expect.objectContaining({
          platforms: [Platform.LINKEDIN, Platform.X, Platform.YOUTUBE],
        }),
      ],
    });
  });

  it("maps unsupported platform labels to generic instead of failing validation", async () => {
    const operator = new GrowthOperator();

    mockClaudeRun.mockResolvedValueOnce({
      success: true,
      data: JSON.stringify({
        signals: [
          {
            topic: "Agent workflow teardown threads",
            momentumScore: 76,
            opportunityScore: 79,
            platforms: ["Threads", "Reddit", "Discord"],
            angle: "Translate noisy experiments into operator-grade playbooks",
            competitorActivity: "low",
            timeframe: "1-2 weeks",
            rationale: "Conversation is active but structured creator content is thin.",
          },
        ],
      }),
      model: ModelChoice.CLAUDE,
      jobType: JobType.TREND_ANALYSIS,
      tokensUsed: 220,
      durationMs: 320,
      timestamp: new Date().toISOString(),
    });

    const result = await operator.execute(buildTrendJob());

    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.data).toEqual({
      signals: [
        expect.objectContaining({
          platforms: [Platform.GENERIC, Platform.GENERIC, Platform.GENERIC],
        }),
      ],
    });
  });
});
