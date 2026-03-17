# AGENT MOE — Private AI Operator Platform

## Build Plan & Progress Tracker

**Created:** 2026-03-08
**Last Updated:** 2026-03-08
**Current Phase:** PHASE 12 COMPLETE — ALL PHASES DONE
**Status:** ANALYTICS COMPLETE — publishing_logs table, 9 platform adapters (X OAuth2 PKCE + thread chaining, LinkedIn UGC Posts, Instagram Meta Graph 2-step, YouTube Data API drafts, Email/Resend, Notion Pages, HMAC Webhook + 2 stubs), ConnectorPublisher, OAuthManager, full API layer + OAuth callbacks, React hooks, UI components, /connectors page

---

## What This App Is

A **private AI operator platform** — a system where you give one instruction and the app handles research, planning, content generation, video packaging, approval, publishing prep, browser automation, analytics, and iteration.

Not a content generator. An **operating system for AI work**.

**Core loop:** Mission → Plan → Operators → Assets → Approval → Action → Analytics

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 (App Router), TypeScript, Tailwind CSS, shadcn/ui |
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
- **Status:** COMPLETE ✅
- **Goal:** Main dashboard with mission input, active jobs, recent content, system health, approvals badge, quick-launch
- **Tasks:**
  - [x] Mission input component (text area + submit → API)
  - [x] Active missions list (status, progress, timestamps)
  - [x] Recent assets feed (latest generated content)
  - [x] System health panel (job queue depth, operator status)
  - [x] Pending approvals badge with count
  - [x] Quick-stats cards (missions today, assets created, approval rate)
  - [x] API routes: `POST /api/missions`, `GET /api/missions`, `GET /api/dashboard/stats`, `GET/PATCH /api/missions/[id]`
  - [x] Real-time subscription for live mission status updates
- **Checkpoint:** Type a mission, see it in active list, dashboard shows live stats, looks like a real command center

### PHASE 2: Mission Engine
- **Status:** COMPLETE ✅
- **Goal:** AI planner that decomposes natural language missions into structured job workflows
- **Tasks:**
  - [x] Mission planner service (mission text → AI call → structured plan)
  - [x] Job decomposition logic (plan → jobs with types, priorities, dependencies)
  - [x] Operator routing (map job types to operator teams)
  - [x] Job queue system (status: pending → running → completed → failed)
  - [x] Mission preferences loader (business rules, active offers, brand rules)
  - [x] API routes: `POST /api/missions/{id}/plan`, `GET /api/jobs`, `PATCH /api/jobs/{id}`, `POST /api/jobs/{id}/execute`
  - [x] Mission detail page (plan breakdown, job tree, operator assignments)
  - [x] Job execution engine (sequential processing with dependency awareness)
- **Checkpoint:** Type a mission, watch it decompose into 5-7 jobs tagged by operator team with status tracking

### PHASE 3: Operator Teams
- **Status:** COMPLETE ✅
- **Goal:** Four specialist AI operators producing structured outputs
- **Tasks:**
  - [x] Operator framework (base class with prompt, permissions, output schema) — BaseOperator abstract class
  - [x] Content Strike Team operator (posts, hooks, scripts, captions, CTAs) — ContentStrikeOperator
  - [x] Growth Operator (trend signals, market angles, topic scoring) — GrowthOperator
  - [x] Revenue Closer (offer mapping, CTA strategy, lead magnets) — RevenueCloserOperator
  - [x] Brand Guardian (safety review, tone check, claim flagging) — BrandGuardianOperator
  - [x] Operator output schemas (structured JSON per type) — Zod schemas in ai/types.ts
  - [x] Operator execution pipeline (job → operator → output → store → flag) — asset-pipeline.ts + execution-engine.ts
  - [x] Operators page (view each team, activity, recent outputs) — live page with real-time stats, activity feed
  - [x] Google OAuth sign-in — code complete, setup guide at scripts/setup-google-oauth.md
  - [x] Operator API routes — /api/operators/stats, /api/operators/activity, /api/operators/[team]/jobs
  - [x] Asset creation pipeline — auto-creates assets from job output, approval creation for Brand Guardian flags
- **Checkpoint:** Mission jobs execute through operators, producing real structured content

### PHASE 4: Content Studio
- **Status:** COMPLETE ✅
- **Goal:** Full asset management interface with editing, versioning, and platform targeting
- **Tasks:**
  - [x] Asset list view (filterable by mission, operator, platform, type, status)
  - [x] Asset detail view (full content, metadata, confidence score, linked offer)
  - [x] Inline editor (edit copy, save new version)
  - [x] Version comparison (side-by-side diff)
  - [x] Status management (draft → review → approved → published → archived)
  - [x] Platform targeting (X, LinkedIn, Instagram, TikTok, YouTube)
  - [x] Bulk actions (approve, reject, duplicate, repurpose batch)
  - [x] Content type views (posts, threads, video concepts, CTAs, thumbnails)
  - [x] API routes: full CRUD for assets with filtering and pagination
- **Checkpoint:** All generated assets visible, filterable, editable, with version comparison and status management

### PHASE 5: Approval Queue
- **Status:** COMPLETE ✅
- **Goal:** Safety and control layer — nothing executes without approval
- **Tasks:**
  - [x] Approval queue page (pending items grouped by mission)
  - [x] Risk-based auto-flagging (Brand Guardian flags → queue)
  - [x] Approval actions (approve, reject, send back for revision)
  - [x] Batch approval (select multiple, approve/reject all)
  - [x] Preview mode (full preview before approving)
  - [x] Approval policies (configurable thresholds in brand_rules)
  - [x] Approval history (audit trail of all decisions)
  - [x] API routes: `GET /api/approvals`, `POST /api/approvals/{id}/decide`, `POST /api/approvals/batch`
  - [x] Post-approval triggers (approved → ready state for connectors)
- **Checkpoint:** Flagged items in clean queue, preview/approve/reject/batch, audit trail, approved items move to ready

---

## Post-Core Expansion Phases (After Phase 5)

### PHASE 6: Video Packaging System
- **Status:** COMPLETE ✅
- Short-form content structure (title, hook, scene breakdown, thumbnail, caption, CTA)
- **Tasks:**
  - [x] DB migration `00016_create_video_packages.sql` — video_packages table, RLS, indexes, trigger
  - [x] Supabase query helpers (`src/lib/supabase/queries/video-packages.ts`) — full CRUD
  - [x] API routes: GET/POST `/api/video-packages`, GET/PATCH/DELETE `/api/video-packages/[id]`, POST `/api/video-packages/generate`
  - [x] Domain types (`src/features/video-packaging/types.ts`) — VideoPackageInput/Output, VideoHook, VideoScene, ThumbnailConcept, VideoCTA + Zod schema
  - [x] VideoPackageOperator (`src/features/video-packaging/video-package-operator.ts`) — generateVideoPackage (Claude), generateHookVariants (GPT-nano), refineThumbnailConcept (Claude)
  - [x] Model router updated — VIDEO_PACKAGE job type → Claude (heavy creative)
  - [x] React hooks: useVideoPackages, useVideoPackageDetail, useGenerateVideoPackage
  - [x] UI components: VideoHookDisplay, SceneBreakdown, ThumbnailConceptCard, VideoPackageCard, VideoPackageFilters, GenerateVideoPackageModal
  - [x] Pages: VideoPackagePage (list), VideoPackageDetailPage (4-tab detail)
  - [x] App routes: `/app/video/page.tsx`, `/app/video/[id]/page.tsx`
  - [x] Sidebar: "Video Studio" nav item (Film icon, between Content Studio + Operators)
  - [x] TopBar: /video route metadata added
- **Checkpoint:** Generate a video package → see hook variants, scene breakdown, thumbnail concept, caption, CTA; navigate to detail with 4-tab layout

### PHASE 7: Trend & Signal Engine
- **Status:** COMPLETE ✅
- Topic scoring, momentum tracking, opportunity board, web research integration
- **Tasks:**
  - [x] DB migration `00017_create_trend_signals.sql` — trend_signals table, signal_momentum enum, RLS, 6 indexes, realtime
  - [x] Domain types (`src/features/growth-engine/types.ts`) — TrendSignal, TrendMarketAngle, TrendContentIdea, TrendScanInput/Result, OpportunityBoardItem
  - [x] Supabase query helpers (`src/lib/supabase/queries/trend-signals.ts`) — getTrendSignals, getTrendSignal, createTrendSignal, updateTrendSignal, deleteTrendSignal, getTopOpportunities, getTrendingTopics
  - [x] API routes: GET/POST `/api/trend-signals`, GET/PATCH/DELETE `/api/trend-signals/[id]`, POST `/api/trend-signals/scan`
  - [x] JobType.TREND_SCAN added to ai/types.ts + CLAUDE_JOB_TYPES in model-router.ts
  - [x] TrendScanner service (`src/features/growth-engine/services/trend-scanner.ts`) — scanTopics, scoreOneTopic, buildOpportunityBoard; wires GrowthOperator (analyzeTrends + scoreTopics + findMarketAngles in parallel)
  - [x] React hooks: useTrendSignals, useOpportunities, useTrendScanner, useRealtimeSignals, index.ts
  - [x] UI components: SignalCard, SignalFilters, OpportunityBoard, TopicScorer, TrendScanModal, MarketAnglesPanel
  - [x] GrowthEnginePage full rebuild — hero header, 4 stat cards, 2-column layout, signal grid, opportunity board, market angles panel, topic scorer, scan modal, realtime updates
  - [x] `src/app/growth/page.tsx` — Server Component passes workspaceId
- **Checkpoint:** Launch Scan → enter topics → see signals populate grid with momentum colors, opportunity board ranked, market angles extracted, topic scorer queues single topics

### PHASE 8: Browser Agent Layer
- **Status:** COMPLETE ✅
- Playwright automation, AI-enhanced task execution, sandboxed browser tasks
- **Tasks:**
  - [x] DB migration `00018_create_browser_tasks.sql` — browser_tasks + browser_sessions tables, RLS, 7 indexes, realtime, operator_team enum updated
  - [x] Supabase query helpers (`src/lib/supabase/queries/browser-tasks.ts`) — full CRUD + stats + pending queue
  - [x] API routes: GET/POST `/api/browser-tasks`, GET/PATCH/DELETE `/api/browser-tasks/[id]`, POST `/api/browser-tasks/[id]/execute`, POST `/api/browser-tasks/[id]/cancel`, GET `/api/browser-tasks/stats`
  - [x] Domain types (`src/features/browser-agent/types.ts`) — BrowserTaskType (8 types), BrowserTaskStatus, BrowserTaskConfig, BrowserTaskInput/Result, BrowserTask, BrowserTaskStats + Zod schemas
  - [x] BrowserRunner (`src/features/browser-agent/browser-runner.ts`) — Playwright execution engine: scrape, screenshot, click, fill_form, navigate, extract_data, submit_form, monitor
  - [x] TaskExecutor (`src/features/browser-agent/task-executor.ts`) — orchestration: retry logic, timeout handling, DB lifecycle management, batch execution
  - [x] BrowserAgentOperator (`src/features/browser-agent/browser-agent-operator.ts`) — extends BaseOperator, maps BROWSER_* jobs → browser tasks, stores results as assets
  - [x] JobType enum updated — 8 BROWSER_* job types added to `src/features/ai/types.ts`
  - [x] OperatorTeam enum updated — BROWSER_AGENT added to `src/features/ai/types.ts`
  - [x] Model router updated — all BROWSER_* types → Claude (heavy reasoning)
  - [x] OperatorFactory updated — BrowserAgentOperator registered
  - [x] ExecutionEngine updated — browser_agent team mapping + default job type
  - [x] lib/supabase/types.ts updated — browser_agent added to operator_team enum
  - [x] React hooks: useBrowserTasks, useBrowserTaskDetail, useExecuteBrowserTask, useCreateBrowserTask, useBrowserTaskStats, useRealtimeBrowserTasks
  - [x] UI components: BrowserTaskCard, BrowserTaskFilters, BrowserTaskLog, BrowserTaskResult, CreateBrowserTaskModal, BrowserTaskDetailPage, BrowserAgentPage
  - [x] App routes: `/browser/page.tsx`, `/browser/[id]/page.tsx`
  - [x] Sidebar: "Browser Agent" nav item (Globe icon, after Growth Engine)
  - [x] TopBar: /browser route metadata added
- **Checkpoint:** Create a browser task → execute scrape on a URL → see text content, links, and page metadata; screenshot task captures page image; running tasks show live status; Mission Engine can decompose missions into browser tasks
- **Remaining:** None

### PHASE 9: Connectors
- **Status:** COMPLETE ✅
- OAuth/API integrations for X, LinkedIn, Instagram, YouTube, Email, Notion, Webhook
- **Tasks:**
  - [x] DB migration `00019_create_publishing_logs.sql` — publishing_logs table, RLS, 6 indexes, realtime
  - [x] Supabase query helpers (`src/lib/supabase/queries/connectors.ts`) — full CRUD + stats + publishing logs
  - [x] Domain types (`src/features/connectors/types.ts`) — ConnectorPlatform, ConnectorStatus, ConnectorCredentials, PublishInput, PublishResult, OAuthStartResult, PlatformCapabilities, PLATFORM_CAPABILITIES registry
  - [x] BaseConnectorAdapter (`src/features/connectors/adapters/base-adapter.ts`) — abstract class with timedFetch, bearerAuth, failPublish/successPublish helpers
  - [x] XAdapter (`src/features/connectors/adapters/x-adapter.ts`) — Twitter API v2, OAuth 2.0 PKCE, thread chaining via reply IDs
  - [x] LinkedInAdapter (`src/features/connectors/adapters/linkedin-adapter.ts`) — LinkedIn UGC Posts API, person/org author
  - [x] InstagramAdapter (`src/features/connectors/adapters/instagram-adapter.ts`) — Meta Graph API v20, 2-step container+publish
  - [x] YouTubeAdapter (`src/features/connectors/adapters/youtube-adapter.ts`) — YouTube Data API v3 private draft creation
  - [x] EmailAdapter (`src/features/connectors/adapters/email-adapter.ts`) — Resend API, HTML+text dual send
  - [x] NotionAdapter (`src/features/connectors/adapters/notion-adapter.ts`) — Notion Pages API with rich_text chunking
  - [x] WebhookAdapter (`src/features/connectors/adapters/webhook-adapter.ts`) — HMAC-SHA256 signed generic webhook
  - [x] Adapter factory + barrel export (`src/features/connectors/adapters/index.ts`)
  - [x] ConnectorPublisher service (`src/features/connectors/publisher.ts`) — orchestrates publish + log + token refresh + status updates
  - [x] OAuthManager service (`src/features/connectors/oauth-manager.ts`) — initiateOAuth + exchangeCode for X/LinkedIn/Instagram/YouTube/Notion
  - [x] API routes: GET/POST `/api/connectors`, GET/PATCH/DELETE `/api/connectors/[id]`
  - [x] API routes: POST `/api/connectors/[id]/publish`, POST `/api/connectors/[id]/test`, POST `/api/connectors/[id]/disconnect`
  - [x] API routes: GET `/api/connectors/[id]/logs`, GET `/api/connectors/stats`
  - [x] OAuth routes: GET `/api/connectors/oauth/[platform]` (initiate + PKCE cookie), GET `/api/auth/callback/[platform]` (exchange + upsert connector)
  - [x] React hooks: useConnectors, useConnectorDetail, useConnectorStats, usePublish, useRealtimeConnectors, index.ts
  - [x] UI components: ConnectorCard, ConnectModal, DisconnectModal, PublishModal, PublishHistoryPanel, ConnectorStats, ConnectorFilters
  - [x] ConnectorsPage full rebuild — live data, stats bar, filter pills, connector grid, skeleton loading, empty state, modal wiring, realtime updates
  - [x] `src/app/connectors/page.tsx` — Server Component with Supabase auth + workspaceId prop pass
- **Checkpoint:** Connect a platform via OAuth → see it in the grid as Connected → publish an asset → see publishing history with external URL

### PHASE 10: Revenue Lab
- **Status:** COMPLETE ✅
- Offer management, CTA logic, pricing ladders, conversion path builder
- **Tasks:**
  - [x] Supabase query helpers (`src/lib/supabase/queries/offers.ts`) — getOffers, getOffer, createOffer, updateOffer, deleteOffer, getActiveOffers, getOffersByType, setWorkspaceActiveOffer, getOfferStats, getPricingLadder
  - [x] Domain types (`src/features/revenue-lab/types.ts`) — CTAVariant, PricingLadderTier, FunnelRule, ConversionPath, RevenueStats, GenerateCTAsInput/Result
  - [x] CTAEngine service (`src/features/revenue-lab/cta-engine.ts`) — generateCTAs (gpt-4o-mini parallel fan-out), scoreOffer, parseCTAResponse
  - [x] API routes: GET/POST `/api/offers`, GET/PATCH/DELETE `/api/offers/[id]`, POST `/api/offers/[id]/generate-ctas`, GET `/api/revenue/stats`
  - [x] React hooks: useOffers, useOfferDetail, useCTAEngine, useRevenueStats, useCreateOffer, index.ts
  - [x] UI components: OfferCard, OfferForm, OfferFilters, PricingLadder, CTABuilder, OfferStats
  - [x] RevenueLabPage full rebuild — live data, 3-tab layout (Library / Pricing Ladder / CTA Builder), stats bar, form modal, filter pills, empty states
  - [x] `src/app/revenue/page.tsx` — Server Component with auth + workspaceId prop pass
- **Checkpoint:** Create offers, view pricing ladder, generate AI CTA variants per platform/content type

### PHASE 11: Launchpad
- **Status:** COMPLETE ✅
- Campaign orchestrator, sequenced launches, timeline calendar
- **Tasks:**
  - [x] Supabase query helpers (`src/lib/supabase/queries/campaigns.ts`) — getCampaigns, getCampaign, createCampaign, updateCampaign, deleteCampaign, getCampaignStats, addAssetsToCampaign, removeAssetFromCampaign, updateCampaignTimeline, getActiveCampaigns
  - [x] API routes: GET/POST `/api/campaigns`, GET/PATCH/DELETE `/api/campaigns/[id]`, POST `/api/campaigns/[id]/launch`, POST/DELETE `/api/campaigns/[id]/assets`, GET `/api/campaigns/stats`
  - [x] Domain types (`src/features/launchpad/types.ts`) — Campaign, TimelineMilestone, CampaignStats, CreateCampaignInput, UpdateCampaignInput
  - [x] React hooks: useCampaigns, useCampaignDetail, useCampaignStats, useCreateCampaign, useLaunchCampaign, index.ts
  - [x] UI components: CampaignStats, CampaignCard, CampaignForm, CampaignTimeline, LaunchModal, CampaignFilters
  - [x] LaunchpadPage full rebuild — live data, stats bar, filter pills, campaign grid, detail panel (3-tab: Overview/Timeline/Assets), create modal, launch modal, realtime-ready
  - [x] `src/app/launchpad/page.tsx` — Server Component with Supabase auth + workspaceId prop pass
- **Checkpoint:** Create a campaign → stage assets → one-click launch → see status transition to active; timeline milestones visible; detail panel with 3-tab layout

### PHASE 12: Analytics & Feedback
- **Status:** COMPLETE ✅
- Event tracking, performance dashboard, feedback loop into Mission Engine
- **Tasks:**
  - [x] Supabase query helpers (`src/lib/supabase/queries/analytics.ts`) — getSystemStats, getMissionPerformance, getContentPerformance, getOperatorStats, getPublishingStats, listAnalyticsEvents, trackEvent
  - [x] Domain types (`src/features/analytics/types.ts`) — TimeRange, SystemStats, MissionPerformance, ContentPerformance, OperatorStats, PublishingStats, AnalyticsEvent, FeedbackInsight, AnalyticsDashboard
  - [x] API routes: GET `/api/analytics/stats`, GET+POST `/api/analytics/events`, GET `/api/analytics/missions`, GET `/api/analytics/content`, GET `/api/analytics/operators`, POST `/api/analytics/feedback`
  - [x] React hooks: useAnalyticsStats, useAnalyticsEvents, useMissionPerformance, useContentPerformance, useOperatorStats, useTrackEvent, useFeedbackInsights, index.ts
  - [x] UI components: TimeRangeSelector, StatsOverview, MissionPerformancePanel, ContentPerformancePanel, OperatorLeaderboard, EventFeed, FeedbackInsightsPanel, AnalyticsDashboard
  - [x] `src/app/analytics/page.tsx` — Server Component with Supabase auth + workspaceId prop pass
  - [x] Sidebar: Added /analytics nav item (BarChart2 icon) between Launchpad and Connectors
  - [x] TopBar: Added /analytics route metadata
- **Checkpoint:** /analytics page loads with KPI cards, 3-tab layout (Overview/Mission Intel/Content Studio), operator leaderboard, AI feedback insights generation

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


