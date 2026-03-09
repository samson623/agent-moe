# AGENT MOE — Private AI Operator Platform

## Build Plan & Progress Tracker

**Created:** 2026-03-08
**Last Updated:** 2026-03-08
**Current Phase:** PHASE 0 → PHASE 1 READY
**Status:** FOUNDATION COMPLETE — awaiting real AI tokens to verify live connectivity

---

## What This App Is

A **private AI operator platform** — a system where you give one instruction and the app handles research, planning, content generation, video packaging, approval, publishing prep, browser automation, analytics, and iteration.

Not a content generator. An **operating system for AI work**.

**Core loop:** Mission → Plan → Operators → Assets → Approval → Action → Analytics

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15.3.0 (App Router), TypeScript, Tailwind CSS, shadcn/ui |
| Backend | Next.js API Routes + Server Actions |
| Database | Supabase (PostgreSQL), Row Level Security, Realtime |
| AI Engine (Heavy) | Anthropic SDK (`@anthropic-ai/sdk`) � Claude OAuth bearer token strategy |
| AI Engine (Light) | OpenAI `gpt-4o-mini` (GPT-5 Nano stand-in) � near-zero cost |
| Browser Automation | Playwright + MCP browser tools |
| Auth | Supabase Auth (private, single user) |
| Package Manager | pnpm |
| Runtime | Node 22, Bun available |

---

## AI Architecture (Dual-Model Strategy)

### Anthropic SDK (Heavy Tasks � Claude OAuth Token Strategy)

Uses `@anthropic-ai/sdk` TypeScript package. Authenticates via `CLAUDE_CODE_OAUTH_TOKEN` (obtained from `claude setup-token`) as a bearer token.

**Used for:**
- Mission planning and decomposition (Mission Engine)
- Content generation (Content Strike Team)
- Deep research and trend analysis (Growth Operator)
- Complex offer/funnel strategy (Revenue Closer)
- Multi-step reasoning tasks
- Browser automation via MCP
- Any task requiring tool use (Read, Write, WebSearch, WebFetch)

**SDK Features leveraged:**
- **Subagents** — Each operator team is a subagent with specialized prompt and tools
- **Built-in tools** — Read, Write, Bash, Glob, Grep, WebSearch, WebFetch
- **MCP support** — Supabase MCP, Playwright MCP for browser automation
- **Sessions** — Maintain context across mission lifecycle
- **Hooks** — Log actions to activity_logs, enforce brand rules
- **Structured output** — JSON schemas for operator output types

### GPT-4o Mini (Light Tasks � GPT-5 Nano Stand-In)

Uses OpenAI API directly via `gpt-4o-mini` for now. The implementation can switch to `gpt-5-nano` later through configuration.

**Used for:**
- Topic scoring and classification
- Quick safety/tone checks
- CTA variant generation
- Content formatting and repurposing
- Status summaries
- Tag and category assignment
- Simple data extraction
- Confidence scoring

**Why both:** Claude handles complex reasoning and tool-using tasks. `gpt-4o-mini` handles high-volume simple tasks at low cost. Best quality where it matters, lowest cost everywhere else.

### Model Router

A `model-router` service decides which model handles each job based on:
- Job type and complexity
- Whether tool use is required
- Whether web access is needed
- Cost threshold settings (configurable in Settings)

### Environment Variables Required

```
CLAUDE_CODE_OAUTH_TOKEN=  # From `claude setup-token`, uses Max subscription
OPENAI_API_KEY=           # For GPT-5 Nano, standard OpenAI API key
```

---

## Database Schema (12 Tables)

| Table | Purpose |
|---|---|
| `users` | Account (single private user) |
| `workspaces` | Private business environment |
| `missions` | Top-level instructions from user |
| `jobs` | Subtasks decomposed from missions |
| `assets` | Generated content and deliverables |
| `offers` | Monetization paths |
| `approvals` | Approval decisions and audit trail |
| `connectors` | Linked external services |
| `analytics_events` | Performance and system data |
| `activity_logs` | System action history |
| `brand_rules` | Tone, blocked claims, safety settings |
| `launch_campaigns` | Grouped campaign sequences |

---

## App Pages (8 Core)

1. **Dashboard / Command Center** — Mission input, health, activity, approvals, stats
2. **Content Studio** — Generated posts, scripts, videos, thumbnails, CTA packs
3. **Operators** — View of each operator team and activity
4. **Growth Engine** — Signals, trend scoring, competitor ideas, opportunity board
5. **Revenue Lab** — Offers, CTA logic, conversion paths, monetization models
6. **Launchpad** — Grouped campaigns and launch timelines
7. **Connectors** — Connected platforms and external services
8. **Settings** — Business rules, tone, approval thresholds, defaults

---

## Operator Teams (4)

| Team | Handles |
|---|---|
| **Content Strike Team** | Posts, hooks, scripts, captions, thumbnails, carousels, CTAs, repurposing |
| **Growth Operator** | Trend scanning, market angles, competitor gaps, audience fit, topic scoring |
| **Revenue Closer** | Offer selection, CTA strategy, lead magnets, funnel logic, conversion positioning |
| **Brand Guardian** | Approval policies, risky claim checks, tone rules, blocked phrases, safety review |

---

## Build Phases

### PHASE 0: Foundation
- **Status:** COMPLETE ✅ (pending real AI token verification)
- **Goal:** Supabase project, Next.js scaffold, database schema, Supabase client, layout shell, env config
- **Tasks:**
  - [x] Create Supabase project (`agent-moe`) in existing org — ref: vxhgbwgspifvanxaowij
  - [x] `supabase init` and link to remote project — linked + all 15 migrations applied
  - [x] Scaffold Next.js app (TypeScript, Tailwind, App Router)
  - [x] Install shadcn/ui component library — components.json + dialog/sheet/tabs/select added
  - [x] Create full database schema (12 tables + functions/triggers/realtime/seed) — 15 migration files written
  - [x] Push migrations to Supabase — all 15 applied, remote is up to date
  - [x] Wire Supabase client (server + browser)
  - [x] Build app shell layout (sidebar nav, header, main content area) — complete with 8 pages, feature placeholders, UI components
  - [x] Verify `.env.local` — Supabase keys confirmed real; CLAUDE_CODE_OAUTH_TOKEN + OPENAI_API_KEY need real values
  - [x] Install `@anthropic-ai/sdk` for Claude (OAuth bearer token strategy)
  - [x] Install OpenAI SDK (`openai`) for GPT-5 Nano
  - [x] Wire model router service (Claude for heavy, GPT-5 Nano for light)
  - [x] Build complete AI types layer (`src/features/ai/types.ts`) — enums, generics, Zod schemas
  - [x] Build ClaudeClient wrapper (`src/features/ai/claude-client.ts`)
  - [x] Build OpenAIClient wrapper (`src/features/ai/openai-client.ts`)
  - [x] Build BaseOperator abstract class (`src/features/ai/operators/base-operator.ts`)
  - [x] Build ContentStrikeOperator (`src/features/ai/operators/content-strike-operator.ts`)
  - [x] Build GrowthOperator (`src/features/ai/operators/growth-operator.ts`)
  - [x] Build RevenueCloserOperator (`src/features/ai/operators/revenue-closer-operator.ts`)
  - [x] Build BrandGuardianOperator (`src/features/ai/operators/brand-guardian-operator.ts`)
  - [x] Build OperatorFactory (`src/features/ai/operator-factory.ts`)
  - [x] Build MissionPlanner (`src/features/ai/mission-planner.ts`)
  - [x] Build AI health endpoint (`src/app/api/ai/health/route.ts`)
  - [x] Build router test endpoint (`src/app/api/ai/route-test/route.ts`)
  - [x] Write model router tests (`__tests__/ai/model-router.test.ts`)
  - [x] Write Claude client tests (`__tests__/ai/claude-client.test.ts`)
  - [x] Write Content Strike operator tests (`__tests__/ai/operators/content-strike.test.ts`)
  - [ ] Verify Claude authenticates with Max subscription token — needs `claude setup-token` + real OPENAI_API_KEY
- **Remaining:** Fill in `CLAUDE_CODE_OAUTH_TOKEN` and `OPENAI_API_KEY` in `.env.local`, then hit `/api/ai/health`
- **Checkpoint:** App runs locally, sidebar nav to all 8 pages, database tables live in Supabase, AI services connected and responding, empty shell clickable

### PHASE 1: Command Center
- **Status:** NOT STARTED
- **Goal:** Main dashboard with mission input, active jobs, recent content, system health, approvals badge, quick-launch
- **Tasks:**
  - [ ] Mission input component (text area + submit → API)
  - [ ] Active missions list (status, progress, timestamps)
  - [ ] Recent assets feed (latest generated content)
  - [ ] System health panel (job queue depth, operator status)
  - [ ] Pending approvals badge with count
  - [ ] Quick-stats cards (missions today, assets created, approval rate)
  - [ ] API routes: `POST /api/missions`, `GET /api/missions`, `GET /api/dashboard/stats`
  - [ ] Real-time subscription for live mission status updates
- **Checkpoint:** Type a mission, see it in active list, dashboard shows live stats, looks like a real command center

### PHASE 2: Mission Engine
- **Status:** NOT STARTED
- **Goal:** AI planner that decomposes natural language missions into structured job workflows
- **Tasks:**
  - [ ] Mission planner service (mission text → AI call → structured plan)
  - [ ] Job decomposition logic (plan → jobs with types, priorities, dependencies)
  - [ ] Operator routing (map job types to operator teams)
  - [ ] Job queue system (status: pending → running → completed → failed)
  - [ ] Mission preferences loader (business rules, active offers, brand rules)
  - [ ] API routes: `POST /api/missions/{id}/plan`, `GET /api/jobs`, `PATCH /api/jobs/{id}`
  - [ ] Mission detail page (plan breakdown, job tree, operator assignments)
  - [ ] Job execution engine (sequential processing with dependency awareness)
- **Checkpoint:** Type a mission, watch it decompose into 5-7 jobs tagged by operator team with status tracking

### PHASE 3: Operator Teams
- **Status:** NOT STARTED
- **Goal:** Four specialist AI operators producing structured outputs
- **Tasks:**
  - [ ] Operator framework (base class with prompt, permissions, output schema)
  - [ ] Content Strike Team operator (posts, hooks, scripts, captions, CTAs)
  - [ ] Growth Operator (trend signals, market angles, topic scoring)
  - [ ] Revenue Closer (offer mapping, CTA strategy, lead magnets)
  - [ ] Brand Guardian (safety review, tone check, claim flagging)
  - [ ] Operator output schemas (structured JSON per type)
  - [ ] Operator execution pipeline (job → operator → output → store → flag)
  - [ ] Operators page (view each team, activity, recent outputs)
- **Checkpoint:** Mission jobs execute through operators, producing real structured content

### PHASE 4: Content Studio
- **Status:** NOT STARTED
- **Goal:** Full asset management interface with editing, versioning, and platform targeting
- **Tasks:**
  - [ ] Asset list view (filterable by mission, operator, platform, type, status)
  - [ ] Asset detail view (full content, metadata, confidence score, linked offer)
  - [ ] Inline editor (edit copy, save new version)
  - [ ] Version comparison (side-by-side diff)
  - [ ] Status management (draft → review → approved → published → archived)
  - [ ] Platform targeting (X, LinkedIn, Instagram, TikTok, YouTube)
  - [ ] Bulk actions (approve, reject, duplicate, repurpose batch)
  - [ ] Content type views (posts, threads, video concepts, CTAs, thumbnails)
  - [ ] API routes: full CRUD for assets with filtering and pagination
- **Checkpoint:** All generated assets visible, filterable, editable, with version comparison and status management

### PHASE 5: Approval Queue
- **Status:** NOT STARTED
- **Goal:** Safety and control layer — nothing executes without approval
- **Tasks:**
  - [ ] Approval queue page (pending items grouped by mission)
  - [ ] Risk-based auto-flagging (Brand Guardian flags → queue)
  - [ ] Approval actions (approve, reject, send back for revision)
  - [ ] Batch approval (select multiple, approve/reject all)
  - [ ] Preview mode (full preview before approving)
  - [ ] Approval policies (configurable thresholds in brand_rules)
  - [ ] Approval history (audit trail of all decisions)
  - [ ] API routes: `GET /api/approvals`, `POST /api/approvals/{id}/decide`, `POST /api/approvals/batch`
  - [ ] Post-approval triggers (approved → ready state for connectors)
- **Checkpoint:** Flagged items in clean queue, preview/approve/reject/batch, audit trail, approved items move to ready

---

## Post-Core Expansion Phases (After Phase 5)

### PHASE 6: Video Packaging System
- Short-form content structure (title, hook, scene breakdown, thumbnail, caption, CTA)

### PHASE 7: Trend & Signal Engine
- Topic scoring, momentum tracking, opportunity board, web research integration

### PHASE 8: Browser Agent Layer
- Playwright automation, task-based execution, sandboxed browser tasks

### PHASE 9: Connectors
- OAuth/API integrations for X, LinkedIn, Instagram, YouTube, email, CRM

### PHASE 10: Revenue Lab
- Offer management, CTA logic, pricing ladders, conversion path builder

### PHASE 11: Launchpad
- Campaign orchestrator, sequenced launches, timeline calendar

### PHASE 12: Analytics & Feedback
- Event tracking, performance dashboard, feedback loop into Mission Engine

---

## Supabase Config

- **Org ID:** mcfdnrzoaxirglyfvifr
- **Project Name:** agent-moe (to be created)
- **Region:** TBD (user to confirm — existing projects use us-east-1 and us-east-2)
- **CLI Version:** 2.77.0
- **Auth Status:** Logged in

## Dev Environment

- **Node:** v22.14.0
- **Python:** 3.13.2
- **pnpm:** 10.18.0
- **Bun:** 1.2.13
- **Playwright:** 1.58.0
- **Git:** 2.49.0
- **Supabase CLI:** 2.77.0 (via npx)
- **Docker:** Not installed (no local Supabase, using remote)

## Workspace

- **Path:** c:\Users\1sams\OneDrive\Desktop\_AGENT MOE
- **Antigravity Kit:** Installed (.agent/ folder with 40+ skills, 16 agents, 11 workflows)
- **App Code:** None yet (to be created in Phase 0)

---

## How to Resume

When starting a new session:
1. Read this file (`PLAN.md`) to see current phase and status
2. Check which tasks are marked `[x]` (completed) vs `[ ]` (pending)
3. Continue from the first unchecked task in the current phase
4. After completing all tasks in a phase, run the checkpoint
5. Update this file with progress before ending session

---

## End-to-End Flow (When Complete)

```
YOU type a mission
  → Command Center accepts it (Phase 1)
    → Mission Engine plans and decomposes (Phase 2)
      → Operators generate real outputs (Phase 3)
        → Content Studio displays everything (Phase 4)
          → Approval Queue lets you control what ships (Phase 5)
            → Connectors publish approved work (Phase 9)
              → Analytics track results (Phase 12)
                → Next mission is smarter (feedback loop)
```


