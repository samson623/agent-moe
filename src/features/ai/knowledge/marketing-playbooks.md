# MARKETING PLAYBOOKS — Executable Agent Workflows

*For Agent MOE operator teams: mission-type playbooks with input→process→output contracts.*

*Doctrine references: `marketing-doctrine.md` | Benchmarks: `marketing-benchmarks.md`*

---

## TABLE OF CONTENTS

1. [Content Engine](#1-content-engine) — Ongoing content production pipeline
2. [Lead Gen Campaign](#2-lead-gen-campaign) — Launch a lead generation campaign
3. [Product/Offer Launch](#3-productoffer-launch) — Bring a new product or offer to market
4. [Brand Positioning](#4-brand-positioning) — Establish or reposition brand identity
5. [Paid Media Campaign](#5-paid-media-campaign) — Plan, launch, and optimize paid ads
6. [Retention/Win-Back](#6-retentionwin-back) — Re-engage churned or at-risk customers
7. [Competitive Response](#7-competitive-response) — React to a competitor move
8. [Growth Diagnostics (Funnel Audit)](#8-growth-diagnostics-funnel-audit) — Diagnose and fix funnel bottlenecks

---

# 1. CONTENT ENGINE

**Type:** Recurring | **Cadence:** Weekly

## Trigger
- Weekly content calendar slot opens
- User requests a content batch for a topic or channel
- Content queue drops below 5 scheduled posts

## Required Inputs
- Brand voice guide (tone, persona, "we are X not Y" pairs)
- Active content pillars (3-5 themes)
- Target audience segment and awareness level (Schwartz 1-5)
- Distribution channels (e.g., LinkedIn, TikTok, Email)
- Any campaign context or trending angles to incorporate

## Agent Sequence
```
Growth Operator → Content Strike Team → Brand Guardian
```

## Per-Agent Contract

### Growth Operator
| | Detail |
|---|---|
| **Inputs** | Audience segment, channels, trending signals |
| **Process** | 1. Score topic ideas with ICE (See Doctrine §2.1 ICE/RICE Scoring) 2. Map each topic to AARRR stage 3. Identify awareness level per topic 4. Output prioritized content brief |
| **Outputs** | Ranked content brief: topic, angle, channel, funnel stage, awareness level, hook direction |
| **Quality Criteria** | Every brief maps to a content pillar; awareness level assigned; no more than 30% BOFU content in a batch |

### Content Strike Team
| | Detail |
|---|---|
| **Inputs** | Content brief from Growth Operator |
| **Process** | 1. Select copy framework per brief (See Doctrine §4.1 — PAS for cold, BAB for transformation, AIDA for awareness) 2. Run Pre-Write Checklist (Doctrine §4.6) 3. Draft headline using 10 highest-converting formulas (Doctrine §4.4) 4. Write body copy 5. Write 3 hook variants 6. Apply 80/20 distribution rule — draft repurposing notes for 2+ additional formats |
| **Outputs** | Final copy per asset, 3 hook variants, repurposing notes |
| **Quality Criteria** | Hook delivers on curiosity or specificity within 3 seconds; CTA is single, action-verb-led; copy matches awareness level; no unsupported superlatives |

### Brand Guardian
| | Detail |
|---|---|
| **Inputs** | Draft copy from Content Strike Team |
| **Process** | 1. Check tone against voice guide dimensions 2. Verify messaging hierarchy alignment (Doctrine §1.2) 3. Flag any claims requiring proof 4. Approve or return with specific edits |
| **Outputs** | Approved copy or annotated revision request |
| **Quality Criteria** | Zero voice inconsistencies; all factual claims sourced; StoryBrand customer-as-hero rule honored |

## Success Metrics
- Output: 5+ approved assets per weekly run
- Engagement rate at or above channel benchmarks (See Benchmarks §3 — TikTok 3.70%, LinkedIn 6.50%)
- Content pillar distribution: 40% Educational / 25% Inspirational / 20% Promotional / 15% Brand Story

## Approval Gates
- Gate 1: Growth Operator brief → User reviews topic priorities before content drafting begins
- Gate 2: Brand Guardian → Human spot-check on any content making bold factual claims or new positioning statements

---

# 2. LEAD GEN CAMPAIGN

**Type:** Campaign | **Duration:** 4-6 weeks

## Trigger
- Pipeline below coverage ratio (target 3-4x — See Benchmarks §5 RevOps Targets)
- New market segment to penetrate
- User requests: "run a lead gen campaign for [offer]"

## Required Inputs
- Offer or lead magnet type (calculator, quiz, checklist — See Doctrine §5.1 Lead Magnet Rankings)
- Target ICP (firmographic/demographic/psychographic profile)
- Budget and channel preferences
- CRM and landing page access
- Historical CVR data if available

## Agent Sequence
```
Growth Operator → Content Strike Team → Revenue Closer → Brand Guardian
```

## Per-Agent Contract

### Growth Operator
| | Detail |
|---|---|
| **Inputs** | ICP, budget, channels, offer |
| **Process** | 1. Select lead magnet type based on ranking (Doctrine §5.1) 2. Map channel mix to Brian Balfour's Four Fits (Doctrine §2.1) 3. Set North Star Metric for campaign 4. Size audience per channel 5. Build UTM structure (Doctrine §2.4) |
| **Outputs** | Campaign brief: channels, budget split, NSM, UTM taxonomy, expected CPL targets |
| **Quality Criteria** | CPL targets reference channel benchmarks (See Benchmarks §5); UTM naming convention enforced |

### Content Strike Team
| | Detail |
|---|---|
| **Inputs** | Campaign brief, ICP, lead magnet |
| **Process** | 1. Write landing page copy (Hero Anatomy — Doctrine §2.2: headline, sub-headline, CTA, social proof, visual direction) 2. Write 3 ad creative variants per channel (cold = PAS, retargeting = BAB) 3. Write lead magnet content if needed 4. Write 3-email nurture opener sequence (Day 0 delivery, Day 3 educational, Day 7 social proof) |
| **Outputs** | Landing page copy, ad creative set (3 variants), lead magnet draft, nurture sequence emails 1-3 |
| **Quality Criteria** | Landing page: single primary CTA, social proof near CTA, form fields ≤3; Email 1 open rate target >80% (Benchmarks §3) |

### Revenue Closer
| | Detail |
|---|---|
| **Inputs** | Nurture sequence, ICP profile, CRM setup |
| **Process** | 1. Define MQL criteria and scoring model (fit + engagement — Doctrine §5.2) 2. Set MQL→SQL SLA: contact within 2 hours (See Benchmarks §5 — 9x conversion lift) 3. Write email 4-7 of nurture sequence using standard B2B schedule (Doctrine §5.3) 4. Draft battle card for sales handoff |
| **Outputs** | Lead scoring rules, SLA doc, nurture emails 4-7, sales battle card |
| **Quality Criteria** | Scoring model separates fit from engagement; MQL alert triggers correctly; battle card has "when they say X, you say Y" section |

### Brand Guardian
| | Detail |
|---|---|
| **Inputs** | All campaign assets |
| **Process** | 1. Audit landing page against brand identity 2. Review all ad creatives for voice consistency 3. Verify email sequence tone is consistent across all 7 emails 4. Confirm lead magnet matches brand quality bar |
| **Outputs** | Approved asset set or revision list |
| **Quality Criteria** | Visual identity and voice are consistent across all touchpoints; no off-brand claims |

## Success Metrics
- CPL vs channel benchmarks (Benchmarks §5: Inbound $40-80, LinkedIn $60-120, Cold Email $20-50)
- Landing page CVR: target 10%+ (Benchmarks §5 — good threshold)
- MQL→SQL rate: target 28-38% (Benchmarks §5 RevOps Targets)
- Nurture email open rates: target 43%+ average (Benchmarks §3)

## Approval Gates
- Gate 1: Campaign brief and budget split → User approves before any spend
- Gate 2: Landing page copy → User reviews before page goes live
- Gate 3: Nurture sequence → User approves full email sequence before launch

---

# 3. PRODUCT/OFFER LAUNCH

**Type:** Campaign | **Duration:** 6-10 weeks

## Trigger
- New product, feature, or offer is ready for market
- User requests: "launch [product/offer]"

## Required Inputs
- Product/offer details: name, description, price, differentiators
- Launch date and any pre-launch window
- Target audience and their awareness level (Schwartz 1-5)
- Launch channels and budget
- Existing customer base size (for existing-customer launch)

## Agent Sequence
```
Brand Guardian → Growth Operator → Content Strike Team → Revenue Closer
```

## Per-Agent Contract

### Brand Guardian
| | Detail |
|---|---|
| **Inputs** | Product details, audience, differentiators |
| **Process** | 1. Run Value Proposition Canvas (Doctrine §1.2): Jobs/Pains/Gains vs Pain Relievers/Gain Creators 2. Define USP using TUID test: True, Unique, Important, Durable (Doctrine §1.4) 3. Establish POPs and PODs (Doctrine §1.4) 4. Write positioning statement 5. Draft messaging hierarchy: Core Promise → 3-4 Pillars → Proof Points (Doctrine §1.2) |
| **Outputs** | Positioning statement, USP, messaging hierarchy, POPs/PODs list |
| **Quality Criteria** | USP passes all four TUID criteria; positioning statement is one sentence; messaging hierarchy has concrete proof points at Layer 3 |

### Growth Operator
| | Detail |
|---|---|
| **Inputs** | Positioning doc, launch date, channels, budget |
| **Process** | 1. Map launch phases: Pre-launch (awareness) → Launch day (activation) → Post-launch (conversion) 2. Set NSM for the launch 3. Design pre-launch warm-up sequence (build anticipation, collect waitlist) 4. Build ICE-scored experiment list for launch week 5. Set up UTM structure and tracking |
| **Outputs** | Launch timeline, channel playbook per phase, experiment backlog, tracking setup |
| **Quality Criteria** | Pre-launch window ≥2 weeks; ICE backlog has at least 5 testable experiments; UTM covers all paid and owned channels |

### Content Strike Team
| | Detail |
|---|---|
| **Inputs** | Messaging hierarchy, launch timeline, channels |
| **Process** | 1. Apply StoryBrand 7-Part Framework (Doctrine §1.2): customer as hero, brand as guide 2. Write launch email sequence (announcement, feature deep-dive, social proof, urgency close) 3. Write sales page using 4Ps framework: Promise/Picture/Proof/Push (Doctrine §4.1) 4. Create social launch content: 3 pre-launch teasers, 5 launch week posts, 3 post-launch case stories 5. Write ad creative for launch paid push |
| **Outputs** | Email sequence (4 emails), sales/landing page, social content set (11 posts), ad creatives (3 variants) |
| **Quality Criteria** | Sales page applies Schwartz awareness-appropriate entry point; urgency in close emails is genuine (not fabricated); all assets follow launch timeline phasing |

### Revenue Closer
| | Detail |
|---|---|
| **Inputs** | All launch assets, sales page, pricing |
| **Process** | 1. Apply pricing psychology principles (Doctrine §5.7): anchoring, decoy, charm pricing 2. Write FAQ handling top 5 objections 3. Design conversion path: ad → landing page → checkout (remove all friction) 4. Set up post-purchase flow (order confirm → onboarding → upsell) 5. Define launch week sales playbook |
| **Outputs** | Pricing page recommendations, objection FAQ, post-purchase sequence, sales playbook |
| **Quality Criteria** | Pricing page has 3-tier structure with "Most Popular" badge; FAQ addresses objections directly; post-purchase sequence starts within 24 hours of conversion |

## Success Metrics
- Launch week conversion rate vs landing page benchmark (target 10%+)
- Email launch sequence open rate (target >43%; announcement email target >60%)
- Revenue generated vs forecast in launch week
- Waitlist-to-buyer conversion rate (pre-launch → customer)

## Approval Gates
- Gate 1: Positioning and messaging hierarchy → User approves before any content is written
- Gate 2: Sales page and pricing page → User approves before launch
- Gate 3: Launch go/no-go 48 hours before launch day → final check on all assets

---

# 4. BRAND POSITIONING

**Type:** Strategic | **Duration:** 3-4 weeks

## Trigger
- New brand or business without established positioning
- User requests repositioning after competitor shift or market change
- Brand health metrics declining (NPS drop, share of voice loss)
- Category design opportunity identified

## Required Inputs
- Business overview: category, target customer, current tagline/description
- 3-5 direct competitors with positioning statements
- Customer pain points and jobs-to-be-done (any existing research)
- Existing brand assets (logo, color, tone guidelines if any)
- Budget/growth stage context

## Agent Sequence
```
Growth Operator → Brand Guardian → Content Strike Team → Brand Guardian (review)
```

## Per-Agent Contract

### Growth Operator
| | Detail |
|---|---|
| **Inputs** | Business overview, competitors, market context |
| **Process** | 1. Build perceptual map: plot brand and competitors on 2 key attribute axes (Doctrine §1.1) 2. Run ERRC Grid (Doctrine §1.1 Blue Ocean): what to Eliminate/Reduce/Raise/Create 3. Identify uncrowded space on perceptual map 4. Run SWOT → Strategic Moves (Doctrine §7.2) 5. Score positioning options with ICE |
| **Outputs** | Perceptual map analysis, ERRC Grid, SWOT summary, 3 positioning territory options with ICE scores |
| **Quality Criteria** | At least one positioning territory avoids head-on competitor overlap; SWOT maps to concrete strategic moves |

### Brand Guardian
| | Detail |
|---|---|
| **Inputs** | 3 positioning territories from Growth Operator |
| **Process** | 1. Select best territory using Category Design lens: does it name or reframe a category? (Doctrine §1.1) 2. Select brand archetype (Doctrine §1.3 — 12 Archetypes) 3. Build messaging hierarchy: Core Promise → Pillars → Proof Points (Doctrine §1.2) 4. Develop tone of voice profile: 4 dimensions + "We are X, not Y" pairs (Doctrine §1.2) 5. Define USP using TUID test (Doctrine §1.4) |
| **Outputs** | Positioning statement, brand archetype, messaging hierarchy, tone of voice guide, USP |
| **Quality Criteria** | Positioning statement is one sentence, ownable, and passes TUID; archetype is defensible with 3+ supporting evidence points; tone pairs are specific, not generic |

### Content Strike Team
| | Detail |
|---|---|
| **Inputs** | Brand positioning package from Brand Guardian |
| **Process** | 1. Write 5 positioning headline variants using top headline formulas (Doctrine §4.4) 2. Draft homepage hero copy applying StoryBrand: customer as hero (Doctrine §1.2) 3. Write 3 "About Us" narrative variants matching archetype voice 4. Create tagline shortlist (5 options) with rationale |
| **Outputs** | 5 headline variants, hero copy, 3 About Us variants, 5 taglines with rationale |
| **Quality Criteria** | Headlines are ≤9 words; hero copy has single CTA; taglines are memorable and own-able; all copy is internally consistent with tone guide |

### Brand Guardian (Review)
| | Detail |
|---|---|
| **Inputs** | All copy from Content Strike Team |
| **Process** | 1. Stress-test all copy against brand archetype 2. Verify customer = hero in all narrative copy 3. Confirm voice consistency across all variants 4. Produce final brand positioning brief |
| **Outputs** | Final approved positioning brief (positioning statement, tagline, hero copy, tone guide) |
| **Quality Criteria** | No inconsistencies across deliverables; brief is self-contained for use in all future playbooks |

## Success Metrics
- Brand health improvement within 90 days: NPS, spontaneous awareness, share of search
- Internal alignment score: team rates clarity of positioning ≥8/10
- External validation: 70%+ of target ICP correctly identifies brand position in user testing

## Approval Gates
- Gate 1: 3 positioning territory options → User selects preferred territory before full development
- Gate 2: Final positioning brief → User must approve before it is written into any system prompts or campaigns

---

# 5. PAID MEDIA CAMPAIGN

**Type:** Campaign | **Duration:** 4-8 weeks active

## Trigger
- User requests: "run paid ads for [goal]"
- Organic channels insufficient for growth target
- Budget available for acquisition push
- Product launch requiring immediate reach

## Required Inputs
- Campaign objective: awareness / leads / sales / retargeting
- Budget and duration
- Target audience (demographics, firmographics, interests, or lookalike source)
- Offer and landing page (or approval to build one)
- Creative assets available (images, videos, brand guidelines)
- Historical ROAS or CPL targets if available

## Agent Sequence
```
Growth Operator → Content Strike Team → Revenue Closer → Growth Operator (optimization loop)
```

## Per-Agent Contract

### Growth Operator (Setup)
| | Detail |
|---|---|
| **Inputs** | Objective, budget, audience, channels |
| **Process** | 1. Select channels based on Four Fits (Doctrine §2.1): match audience to channel behavior 2. Apply bidding ladder (Doctrine §3.2): start Maximize Conversions → Target CPA → Target ROAS 3. Set daily budget rule: 10-15x target CPA (Doctrine §3.2) 4. Design retargeting tiers: TOFU (30-day visitors) → MOFU (14-day product viewers) → BOFU (7-day cart abandoners) (Doctrine §3.2) 5. Build UTM tracking structure (Doctrine §2.4) 6. Set frequency caps: 5-7/week per user |
| **Outputs** | Channel plan, budget allocation by channel/tier, targeting specs, UTM structure, bidding strategy |
| **Quality Criteria** | Budget aligns with 10-15x CPA rule; all three retargeting tiers defined; frequency cap in place |

### Content Strike Team
| | Detail |
|---|---|
| **Inputs** | Channel plan, audience profile, offer, brand guidelines |
| **Process** | 1. Write 3+ ad creative variants per channel using AIDA (cold) / BAB (retargeting) (Doctrine §4.1) 2. Apply platform-specific creative rules: TikTok = hook in 0-3s (Doctrine §3.2); Meta = UGC-style outperforms polished (Benchmarks §3); LinkedIn = Lead Gen Form copy over landing page (Benchmarks §3) 3. Write 5+ headline variants per ad set using highest-converting formulas (Doctrine §4.4) 4. For Performance Max / AI campaigns: provide maximum asset variety (15+ images, 5+ videos, max headlines — Benchmarks §6) |
| **Outputs** | Creative set: 3+ variants per channel, headline variants, ad copy, asset upload checklist |
| **Quality Criteria** | TikTok: hook lands in first 3 seconds; Meta: at least 1 UGC-style variant; LinkedIn: Lead Gen Form copy written; all ads have single CTA |

### Revenue Closer
| | Detail |
|---|---|
| **Inputs** | Creative set, landing page, offer |
| **Process** | 1. Audit landing page CVR optimization: form fields ≤3, social proof near CTA, single CTA (Doctrine §2.2) 2. Apply pricing psychology where relevant (Doctrine §5.7) 3. Set up post-click nurture for leads (hand off to email or CRM) 4. Define conversion events and value tracking |
| **Outputs** | Landing page audit with fixes, conversion tracking setup, lead handoff protocol |
| **Quality Criteria** | Landing page score ≥3 CRO fixes applied; conversion events fire correctly; leads route to CRM within 1 hour |

### Growth Operator (Optimization Loop)
| | Detail |
|---|---|
| **Inputs** | Live campaign data (weekly) |
| **Process** | 1. Check creative performance: retire underperformers after sufficient spend (Doctrine §3.2) 2. Advance bidding strategy when data thresholds met 3. Scale winning ad sets 4. Report ROAS vs benchmarks (Benchmarks §3: Google 2-8x, Meta 2-4x ecom / 3-7x lead gen) 5. Recommend A/B tests using RICE scoring (Doctrine §2.1) |
| **Outputs** | Weekly performance report, creative rotation decisions, bid strategy recommendations |
| **Quality Criteria** | Underperforming creatives replaced within 2 weeks; ROAS trending toward benchmark; at least 1 A/B test running at all times |

## Success Metrics
- ROAS vs channel benchmarks (Benchmarks §3)
- CPA vs target (Google avg $23.74, Meta avg $38.17 — Benchmarks §3)
- Landing page CVR: target 10%+ (Benchmarks §5)
- Creative CTR vs platform medians (Meta: 2.19% — Benchmarks §3)

## Approval Gates
- Gate 1: Campaign plan and budget split → User approves before any spend
- Gate 2: Creative set → User approves all ads before launch
- Gate 3: Week 2 performance review → User approves bid strategy advancement or creative rotation

---

# 6. RETENTION / WIN-BACK

**Type:** Campaign | **Duration:** 4-6 weeks

## Trigger
- Monthly churn exceeds 3.5% (See Benchmarks §2)
- RFM segmentation identifies At-Risk or Hibernating customers (Doctrine §7.5)
- NPS drops below 30
- User requests: "re-engage churned customers" or "reduce churn"

## Required Inputs
- Customer segment data with RFM scores (Doctrine §7.5)
- Churn reasons if known (exit surveys, support tickets, win/loss data)
- Available win-back offers or incentives
- Email/SMS access to lapsed customer list
- Current NPS and retention rate benchmarks

## Agent Sequence
```
Growth Operator → Revenue Closer → Content Strike Team → Brand Guardian
```

## Per-Agent Contract

### Growth Operator
| | Detail |
|---|---|
| **Inputs** | RFM segment data, churn rate, churn reasons |
| **Process** | 1. Segment lapsed customers into RFM tiers: At-Risk, Lost Champions, Hibernating (Doctrine §7.5) 2. Prioritize segments: Lost Champions first (highest LTV potential), Hibernating last 3. Identify involuntary churn (payment failures) — fix with dunning first (Doctrine §2.6) 4. Calculate win-back ROI: LTV x segment size x expected reactivation rate vs campaign cost 5. Score re-engagement channels with ICE (email, SMS, paid retargeting, direct outreach) |
| **Outputs** | Segment prioritization, dunning protocol (if involuntary churn present), channel plan, ROI model |
| **Quality Criteria** | Involuntary churn addressed before voluntary; LTV:CAC ratio ≥3:1 for campaign to proceed; segments are mutually exclusive |

### Revenue Closer
| | Detail |
|---|---|
| **Inputs** | Segment prioritization, churn reasons, available offers |
| **Process** | 1. Design win-back offer per segment: Lost Champions = high-value (exclusive access, significant discount); Hibernating = low-cost activation (content value, small incentive) 2. Apply loss framing: frame offer as cost of staying away, not cost of returning (Doctrine §5.7) 3. Set urgency with real deadline (Doctrine §4.2 Cialdini Scarcity — must be genuine) 4. Design post-reactivation onboarding to prevent immediate re-churn 5. Define success: what does "reactivated" mean for each segment? |
| **Outputs** | Offer structure per segment, urgency/deadline plan, post-reactivation onboarding steps |
| **Quality Criteria** | Offer value scales with segment LTV; deadline is genuine; post-reactivation onboarding starts within 24 hours of re-engagement |

### Content Strike Team
| | Detail |
|---|---|
| **Inputs** | Segment offers, churn reasons, channel plan |
| **Process** | 1. Write re-engagement email sequence using Core 5 Flow: "we miss you" → "here's what's new" → "last chance" (Doctrine §3.4) 2. Apply PAS framework addressing specific churn reasons (Doctrine §4.1): Problem = why they left, Agitate = cost of staying away, Solution = win-back offer 3. Write SMS touchpoints (max 4-8/month — Doctrine §3.5) for high-priority segments 4. Write retargeting ad copy for paid win-back channel |
| **Outputs** | Re-engagement email sequence (3 emails), SMS sequence (2-3 messages), retargeting ad copy |
| **Quality Criteria** | Email 1 "we miss you" open rate target >43%; copy addresses specific churn reasons, not generic; each touchpoint has single low-friction CTA |

### Brand Guardian
| | Detail |
|---|---|
| **Inputs** | All re-engagement assets |
| **Process** | 1. Verify tone is empathetic, not aggressive or guilt-inducing 2. Confirm voice consistency with overall brand 3. Check that urgency claims are genuine 4. Approve sequence or return with specific edits |
| **Outputs** | Approved asset set |
| **Quality Criteria** | Tone passes empathy test; urgency is not manufactured; brand voice is consistent across all touchpoints |

## Success Metrics
- Reactivation rate by segment: Lost Champions target 10-20%, Hibernating target 2-5%
- Churn rate reduction vs baseline within 60 days
- Revenue recovered vs campaign cost (target positive ROI)
- NPS improvement in reactivated cohort within 30 days

## Approval Gates
- Gate 1: Segment prioritization and ROI model → User approves before offer design
- Gate 2: Offer structure per segment → User approves before content is written
- Gate 3: Full sequence → User reviews before any sends to lapsed customers

---

# 7. COMPETITIVE RESPONSE

**Type:** Reactive | **Duration:** 48-72 hours (initial); 2-4 weeks (sustained)

## Trigger
- Competitor announces major product/feature/price change
- Competitor launches aggressive marketing campaign targeting our audience
- Competitor lands significant PR or media coverage
- Competitor acquires a key partner or enters new category
- Share of voice or keyword rankings drop suddenly

## Required Inputs
- Competitor move details (what changed, when, where announced)
- Our current positioning and messaging hierarchy
- Customer-facing assets that may need updating
- Any existing battle cards or competitive intelligence
- Sales team feedback on competitive objections in the field

## Agent Sequence
```
Growth Operator → Brand Guardian → Content Strike Team → Revenue Closer
```

## Per-Agent Contract

### Growth Operator
| | Detail |
|---|---|
| **Inputs** | Competitor move details, our current positioning, market context |
| **Process** | 1. Classify the threat: Positioning (they're claiming our territory), Product (they've closed a feature gap), Price (they've undercut), Distribution (new channel/partnership) 2. Run SWOT → Strategic Moves on the new competitive landscape (Doctrine §7.2) 3. Review Porter's Five Forces impact (Doctrine §7.2) 4. Apply Weak Signal Detection if this is part of a larger pattern (Doctrine §7.4) 5. Score response options with ICE: ignore / counter-position / accelerate roadmap / launch counter-campaign |
| **Outputs** | Threat classification, competitive impact assessment, ICE-scored response options, recommended response strategy |
| **Quality Criteria** | Response is proportional to threat; options include "do nothing" as a scored option; assessment delivered within 24 hours |

### Brand Guardian
| | Detail |
|---|---|
| **Inputs** | Recommended response strategy, our positioning |
| **Process** | 1. Determine if our positioning holds or needs adjustment 2. If repositioning needed: run abbreviated Brand Positioning playbook (Playbook 4) 3. Update messaging hierarchy to address the competitive context 4. Update battle card: their new move + our counter-narrative (Doctrine §5.4) 5. Identify which Cialdini principles they are using and how we can counter (Doctrine §4.2) |
| **Outputs** | Updated positioning statement (if needed), updated battle card, counter-narrative messaging |
| **Quality Criteria** | Counter-narrative is affirmative (what we ARE), not just reactive (what they're not); battle card has "when they say X, you say Y" updated |

### Content Strike Team
| | Detail |
|---|---|
| **Inputs** | Counter-narrative messaging, response strategy, channels |
| **Process** | 1. Write reactive content addressing competitor move without naming them (category reframe preferred) 2. Boost POD content (Points of Difference — Doctrine §1.4): publish proof points and differentiators 3. Create comparison content if direct comparison is the chosen strategy 4. Refresh key SEO landing pages if competitor is targeting our keywords 5. Draft internal FAQ for sales team (handling "I heard [competitor] now has X") |
| **Outputs** | 3-5 reactive content pieces, refreshed POD content set, internal sales FAQ |
| **Quality Criteria** | No content attacks competitor by name unless user explicitly approves; all claims are provable; POD content is specific and quantified |

### Revenue Closer
| | Detail |
|---|---|
| **Inputs** | Updated battle card, sales FAQ, competitive context |
| **Process** | 1. Update sales enablement materials with new battle card 2. Brief sales team on response playbook 3. Identify at-risk pipeline deals (deals where competitor is being evaluated) 4. Design accelerator offer for at-risk deals (limited-time incentive to close before competitor does) 5. Run win/loss review on recent losses attributed to this competitor (Doctrine §7.2) |
| **Outputs** | Updated sales battle card, pipeline risk list, accelerator offer design, win/loss insights |
| **Quality Criteria** | Accelerator offer is time-limited with genuine expiry; battle card distributed to sales within 48 hours of threat classification; win/loss interviews scheduled within 2-4 weeks |

## Success Metrics
- Response deployed within 72 hours of threat classification
- Share of voice vs competitor: trend stabilized within 30 days
- At-risk deal win rate: target ≥50% of identified at-risk deals retained
- Sales team confidence score on competitive objections: ≥8/10

## Approval Gates
- Gate 1: Threat classification and response options → User selects response strategy before action
- Gate 2: Counter-narrative and updated positioning → User approves any messaging changes
- Gate 3: Any publicly facing comparison content → User must review before publish

---

# 8. GROWTH DIAGNOSTICS (FUNNEL AUDIT)

**Type:** Diagnostic | **Duration:** 1-2 weeks

## Trigger
- Growth has plateaued or declined for 2+ consecutive months
- User requests: "why aren't we growing?" or "audit our funnel"
- New leadership or investor request for growth assessment
- Major channel, product, or market change that may have shifted funnel dynamics

## Required Inputs
- Analytics access: traffic, conversion events, retention data by cohort
- Current funnel stage metrics: acquisition, activation, retention, referral, revenue (AARRR)
- Channel attribution data (UTM data, ad platform data)
- Customer survey data or NPS results if available
- Current LTV, CAC, churn rate, MRR

## Agent Sequence
```
Growth Operator → Revenue Closer → Content Strike Team → Growth Operator (synthesis)
```

## Per-Agent Contract

### Growth Operator (Audit)
| | Detail |
|---|---|
| **Inputs** | Analytics data, AARRR metrics, channel data |
| **Process** | 1. Map full AARRR funnel with conversion rates at each stage (Doctrine §2.1) 2. Identify the biggest drop-off — this is Priority #1 (Doctrine Quick Reference Decision Tree) 3. Run Sean Ellis 40% test analysis: is PMF confirmed or in question? (Doctrine §2.1) 4. Assess growth loop potential: are there any loops with K>0.3? (Doctrine §2.1, 2.5) 5. Score all identified bottlenecks with ICE to build prioritized fix backlog 6. Check Day 7 / Day 30 retention curves: flat = scale, declining to zero = fix product |
| **Outputs** | AARRR funnel map with CVRs, PMF assessment, bottleneck list with ICE scores, retention curve analysis |
| **Quality Criteria** | Every funnel stage has a measured CVR; PMF verdict is stated; top 3 bottlenecks are clearly ranked |

### Revenue Closer
| | Detail |
|---|---|
| **Inputs** | Bottleneck list, LTV/CAC/churn data |
| **Process** | 1. Calculate current LTV:CAC ratio and benchmark against 3:1 target (Doctrine §2.7) 2. Calculate Pipeline Velocity (Doctrine §5.5) and identify which variable is dragging it down 3. Assess MQL→SQL→Win rates vs RevOps benchmarks (Benchmarks §5) 4. Identify revenue leakage points: involuntary churn, missed upsells, abandoned checkout 5. Calculate impact of a 5% churn reduction on profit (Doctrine §2.6 Bain reference) |
| **Outputs** | LTV:CAC analysis, Pipeline Velocity breakdown, RevOps benchmark comparison, revenue leakage map |
| **Quality Criteria** | All calculations shown with source data; each leakage point has estimated revenue impact; recommendations prioritized by revenue impact |

### Content Strike Team
| | Detail |
|---|---|
| **Inputs** | Bottleneck list, conversion audit, funnel map |
| **Process** | 1. Audit top-of-funnel content: is it mapped correctly to TOFU awareness level? (Doctrine §4.5) 2. Audit landing pages against Hero Section Anatomy (Doctrine §2.2) — score each element present/absent 3. Check email sequences against Core 5 Automated Flows (Doctrine §3.4) — identify missing flows 4. Assess content pillar distribution vs 40/25/20/15 benchmark (Doctrine §4.3) 5. Identify highest-impact content fix per funnel stage |
| **Outputs** | Content audit per funnel stage, landing page score card, email flow gap analysis, content fix priority list |
| **Quality Criteria** | Every funnel stage assessed; landing page score card has numeric score (elements present / total elements); at least 1 specific content fix per stage |

### Growth Operator (Synthesis)
| | Detail |
|---|---|
| **Inputs** | All audit outputs from all three agents |
| **Process** | 1. Synthesize all findings into a single prioritized action plan 2. Apply Marketing Agent Decision Tree (Doctrine Quick Reference) to confirm priorities 3. Map top 5 fixes to playbooks in this file — assign each fix a playbook to execute 4. Estimate revenue impact of each fix 5. Set 30/60/90 day milestones |
| **Outputs** | Executive summary (1 page), prioritized action plan (top 10 fixes), playbook assignment map, 90-day milestone plan |
| **Quality Criteria** | Every fix maps to a measurable metric; executive summary is actionable, not just descriptive; playbook assignments are specific (e.g., "Run Playbook 2 for LinkedIn lead gen") |

## Success Metrics
- Funnel audit delivered within 10 business days
- Top 3 bottlenecks have active fix playbooks running within 30 days
- North Star Metric trending positive within 60 days
- LTV:CAC ratio improving quarter-over-quarter

## Approval Gates
- Gate 1: AARRR funnel map and PMF assessment → User reviews and confirms data accuracy before analysis proceeds
- Gate 2: Prioritized action plan → User approves top 5 fixes and playbook assignments before any execution begins
- Gate 3: 30-day check-in → User reviews progress vs milestones and approves any strategy pivots

---

# QUICK REFERENCE: PLAYBOOK SELECTION

```
WHAT IS THE GOAL?
  → Build a content pipeline          → Playbook 1: Content Engine
  → Generate new leads                → Playbook 2: Lead Gen Campaign
  → Launch a product or offer         → Playbook 3: Product/Offer Launch
  → Define or fix brand identity      → Playbook 4: Brand Positioning
  → Run paid ads                      → Playbook 5: Paid Media Campaign
  → Reduce churn / win back customers → Playbook 6: Retention/Win-Back
  → React to a competitor move        → Playbook 7: Competitive Response
  → Diagnose why growth is stuck      → Playbook 8: Growth Diagnostics

WHICH TEAM LEADS?
  → Content creation / copy           → Content Strike Team leads
  → Growth strategy / experiment      → Growth Operator leads
  → Sales / conversion / nurture      → Revenue Closer leads
  → Brand voice / positioning         → Brand Guardian leads

MINIMUM APPROVAL GATES (non-negotiable):
  1. Budget allocation — always user-approved before spend
  2. Positioning or messaging changes — always user-approved
  3. Any public-facing claims or comparisons — always user-approved
  4. Launch go/no-go decisions — always user-approved
```
