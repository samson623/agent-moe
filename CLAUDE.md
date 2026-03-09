# AGENT MOE — Claude Code Context

When working on this project, ALWAYS start by reading these files:

1. `PLAN.md` — Complete build plan with 12 phases, task checklists, tech stack, and database schema
2. `PROGRESS.md` — Session-by-session progress log

## Rules

- This is a private AI operator platform (NOT SaaS, NOT public)
- Build in phases. Each phase has a checkpoint requiring user approval.
- Update `PLAN.md` task checkboxes as you complete work
- Add a new session entry to `PROGRESS.md` before ending any session
- Tech stack: Next.js 16, TypeScript, Tailwind, shadcn/ui, Supabase, pnpm
- Feature-based architecture: `src/features/`
- Server Components by default
- 4 AI operator teams: Content Strike Team, Growth Operator, Revenue Closer, Brand Guardian

## AI Architecture (Critical)
- **Claude Agent SDK** (`@anthropic-ai/claude-agent-sdk`) for heavy tasks — Max subscription, $0 cost
- **GPT-5 Nano** (OpenAI API) for light tasks — $0.05/M input, $0.40/M output
- Operator teams are Claude Agent SDK **subagents** with specialized prompts and tool permissions
- Model Router service decides which model handles each job
- Auth tokens: `CLAUDE_CODE_OAUTH_TOKEN` + `OPENAI_API_KEY`
