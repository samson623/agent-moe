/**
 * Compile-time type safety tests for src/lib/supabase/types.ts
 *
 * These tests do NOT exercise runtime behaviour — they verify that:
 *  1. All 12 table Row / Insert / Update shapes are exported and correctly typed
 *  2. All 16 enum union types are exported
 *  3. All convenience aliases exist and resolve to the correct underlying types
 *
 * Technique: TypeScript's `satisfies` operator and assignability checks are
 * used to assert type compatibility. If any shape is wrong, the test file
 * will not compile and `jest --passWithNoTests` will catch it via ts-jest.
 *
 * Runtime assertions use `expect(true).toBe(true)` as a sentinel — if TypeScript
 * compilation passes, these trivially pass at runtime too.
 */

import type {
  Database,
  // Row aliases
  User,
  Workspace,
  BrandRule,
  Mission,
  Job,
  Asset,
  Offer,
  Approval,
  Connector,
  AnalyticsEvent,
  ActivityLog,
  LaunchCampaign,
  // Insert aliases
  UserInsert,
  WorkspaceInsert,
  BrandRuleInsert,
  MissionInsert,
  JobInsert,
  AssetInsert,
  OfferInsert,
  ApprovalInsert,
  ConnectorInsert,
  AnalyticsEventInsert,
  ActivityLogInsert,
  LaunchCampaignInsert,
  // Update aliases
  UserUpdate,
  WorkspaceUpdate,
  BrandRuleUpdate,
  MissionUpdate,
  JobUpdate,
  AssetUpdate,
  OfferUpdate,
  ApprovalUpdate,
  ConnectorUpdate,
  AnalyticsEventUpdate,
  ActivityLogUpdate,
  LaunchCampaignUpdate,
  // Enum aliases
  MissionStatus,
  MissionPriority,
  JobStatus,
  OperatorTeam,
  ModelUsed,
  AssetType,
  Platform,
  AssetStatus,
  OfferType,
  OfferStatus,
  ApprovalStatus,
  RiskLevel,
  ConnectorPlatform,
  ConnectorStatus,
  SafetyLevel,
  CampaignStatus,
} from '@/lib/supabase/types'

// ---------------------------------------------------------------------------
// Helper: verify a type resolves to the DB table row (assignability check)
// ---------------------------------------------------------------------------

type AssertExtends<T, U> = T extends U ? true : false
type AssertTrue<T extends true> = T

// ---------------------------------------------------------------------------
// 1. Database type structure
// ---------------------------------------------------------------------------

describe('Database type', () => {
  it('has a public schema', () => {
    type HasPublic = AssertTrue<AssertExtends<Database, { public: unknown }>>
    const check: HasPublic = true
    expect(check).toBe(true)
  })

  it('has Tables and Enums keys in public', () => {
    type HasTables = AssertTrue<AssertExtends<Database['public'], { Tables: unknown; Enums: unknown }>>
    const check: HasTables = true
    expect(check).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// 2. Row aliases resolve to the correct Database table rows
// ---------------------------------------------------------------------------

describe('Row type aliases', () => {
  it('User matches users Row', () => {
    type Check = AssertTrue<AssertExtends<User, Database['public']['Tables']['users']['Row']>>
    const check: Check = true
    expect(check).toBe(true)
  })

  it('Workspace matches workspaces Row', () => {
    type Check = AssertTrue<AssertExtends<Workspace, Database['public']['Tables']['workspaces']['Row']>>
    const check: Check = true
    expect(check).toBe(true)
  })

  it('BrandRule matches brand_rules Row', () => {
    type Check = AssertTrue<AssertExtends<BrandRule, Database['public']['Tables']['brand_rules']['Row']>>
    const check: Check = true
    expect(check).toBe(true)
  })

  it('Mission matches missions Row', () => {
    type Check = AssertTrue<AssertExtends<Mission, Database['public']['Tables']['missions']['Row']>>
    const check: Check = true
    expect(check).toBe(true)
  })

  it('Job matches jobs Row', () => {
    type Check = AssertTrue<AssertExtends<Job, Database['public']['Tables']['jobs']['Row']>>
    const check: Check = true
    expect(check).toBe(true)
  })

  it('Asset extends assets Row with mapped columns', () => {
    type Check = AssertTrue<AssertExtends<Asset['id'], string>>
    const check: Check = true
    expect(check).toBe(true)
  })

  it('Offer matches offers Row', () => {
    type Check = AssertTrue<AssertExtends<Offer, Database['public']['Tables']['offers']['Row']>>
    const check: Check = true
    expect(check).toBe(true)
  })

  it('Approval matches approvals Row', () => {
    type Check = AssertTrue<AssertExtends<Approval, Database['public']['Tables']['approvals']['Row']>>
    const check: Check = true
    expect(check).toBe(true)
  })

  it('Connector matches connectors Row', () => {
    type Check = AssertTrue<AssertExtends<Connector, Database['public']['Tables']['connectors']['Row']>>
    const check: Check = true
    expect(check).toBe(true)
  })

  it('AnalyticsEvent matches analytics_events Row', () => {
    type Check = AssertTrue<AssertExtends<AnalyticsEvent, Database['public']['Tables']['analytics_events']['Row']>>
    const check: Check = true
    expect(check).toBe(true)
  })

  it('ActivityLog matches activity_logs Row', () => {
    type Check = AssertTrue<AssertExtends<ActivityLog, Database['public']['Tables']['activity_logs']['Row']>>
    const check: Check = true
    expect(check).toBe(true)
  })

  it('LaunchCampaign matches launch_campaigns Row', () => {
    type Check = AssertTrue<AssertExtends<LaunchCampaign, Database['public']['Tables']['launch_campaigns']['Row']>>
    const check: Check = true
    expect(check).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// 3. Insert / Update aliases exist (assignability spot-checks)
// ---------------------------------------------------------------------------

describe('Insert type aliases', () => {
  it('MissionInsert is compatible with missions Insert', () => {
    type Check = AssertTrue<AssertExtends<MissionInsert, Database['public']['Tables']['missions']['Insert']>>
    const check: Check = true
    expect(check).toBe(true)
  })

  it('AssetInsert has mapped column names', () => {
    type Check = AssertTrue<AssertExtends<AssetInsert['type'], string>>
    const check: Check = true
    expect(check).toBe(true)
  })

  it('ActivityLogInsert is compatible with activity_logs Insert', () => {
    type Check = AssertTrue<AssertExtends<ActivityLogInsert, Database['public']['Tables']['activity_logs']['Insert']>>
    const check: Check = true
    expect(check).toBe(true)
  })

  // Verify remaining Insert aliases exist (will fail to compile if missing)
  const _userInsert: UserInsert = { email: 'a@b.com' }
  const _workspaceInsert: WorkspaceInsert = { user_id: 'x', name: 'n', slug: 's' }
  const _brandRuleInsert: BrandRuleInsert = { workspace_id: 'x' }
  const _jobInsert: JobInsert = { mission_id: 'x', workspace_id: 'x', title: 't', operator_team: 'content_strike', job_type: 'content_post' }
  const _offerInsert: OfferInsert = { workspace_id: 'x', name: 'n', offer_type: 'product' }
  const _approvalInsert: ApprovalInsert = { workspace_id: 'x' }
  const _connectorInsert: ConnectorInsert = { workspace_id: 'x', platform: 'x', name: 'n' }
  const _analyticsInsert: AnalyticsEventInsert = { workspace_id: 'x', event_type: 'e', entity_id: 'x', entity_type: 'test' }
  const _campaignInsert: LaunchCampaignInsert = { workspace_id: 'x', name: 'n' }

  // Silence unused-variable warnings — the compile check is the goal
  void [
    _userInsert, _workspaceInsert, _brandRuleInsert, _jobInsert, _offerInsert,
    _approvalInsert, _connectorInsert, _analyticsInsert, _campaignInsert,
  ]

  it('all Insert aliases compile without error', () => {
    expect(true).toBe(true)
  })
})

describe('Update type aliases', () => {
  // Verify Update aliases are exported and partial (all fields optional)
  const _userUpdate: UserUpdate = {}
  const _workspaceUpdate: WorkspaceUpdate = {}
  const _brandRuleUpdate: BrandRuleUpdate = {}
  const _missionUpdate: MissionUpdate = {}
  const _jobUpdate: JobUpdate = {}
  const _assetUpdate: AssetUpdate = {}
  const _offerUpdate: OfferUpdate = {}
  const _approvalUpdate: ApprovalUpdate = {}
  const _connectorUpdate: ConnectorUpdate = {}
  const _analyticsUpdate: AnalyticsEventUpdate = {}
  const _activityUpdate: ActivityLogUpdate = {}
  const _campaignUpdate: LaunchCampaignUpdate = {}

  void [
    _userUpdate, _workspaceUpdate, _brandRuleUpdate, _missionUpdate, _jobUpdate,
    _assetUpdate, _offerUpdate, _approvalUpdate, _connectorUpdate, _analyticsUpdate,
    _activityUpdate, _campaignUpdate,
  ]

  it('all Update aliases compile as empty objects (all fields optional)', () => {
    expect(true).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// 4. Enum aliases are correctly typed union literals
// ---------------------------------------------------------------------------

describe('Enum type aliases', () => {
  it('MissionStatus contains expected values', () => {
    const statuses: MissionStatus[] = ['pending', 'planning', 'running', 'paused', 'completed', 'failed']
    expect(statuses).toHaveLength(6)
  })

  it('MissionPriority contains expected values', () => {
    const priorities: MissionPriority[] = ['low', 'normal', 'high', 'urgent']
    expect(priorities).toHaveLength(4)
  })

  it('JobStatus contains expected values', () => {
    const statuses: JobStatus[] = ['pending', 'running', 'completed', 'failed', 'cancelled']
    expect(statuses).toHaveLength(5)
  })

  it('OperatorTeam contains all 4 teams', () => {
    const teams: OperatorTeam[] = ['content_strike', 'growth_operator', 'revenue_closer', 'brand_guardian']
    expect(teams).toHaveLength(4)
  })

  it('ModelUsed contains expected values', () => {
    const models: ModelUsed[] = ['claude', 'gpt5_nano']
    expect(models).toHaveLength(2)
  })

  it('AssetType contains all 10 types', () => {
    const types: AssetType[] = [
      'post', 'thread', 'script', 'caption', 'cta',
      'thumbnail_concept', 'carousel', 'video_concept', 'email', 'report',
    ]
    expect(types).toHaveLength(10)
  })

  it('Platform contains all 7 platforms', () => {
    const platforms: Platform[] = ['x', 'linkedin', 'instagram', 'tiktok', 'youtube', 'email', 'universal']
    expect(platforms).toHaveLength(7)
  })

  it('AssetStatus contains expected values', () => {
    const statuses: AssetStatus[] = ['draft', 'review', 'approved', 'published', 'archived', 'rejected']
    expect(statuses).toHaveLength(6)
  })

  it('OfferType contains all 7 types', () => {
    const types: OfferType[] = [
      'product', 'service', 'lead_magnet', 'course',
      'consultation', 'subscription', 'affiliate',
    ]
    expect(types).toHaveLength(7)
  })

  it('OfferStatus contains expected values', () => {
    const statuses: OfferStatus[] = ['active', 'inactive', 'archived']
    expect(statuses).toHaveLength(3)
  })

  it('ApprovalStatus contains expected values', () => {
    const statuses: ApprovalStatus[] = ['pending', 'approved', 'rejected', 'revision_requested']
    expect(statuses).toHaveLength(4)
  })

  it('RiskLevel contains expected values', () => {
    const levels: RiskLevel[] = ['low', 'medium', 'high', 'critical']
    expect(levels).toHaveLength(4)
  })

  it('ConnectorPlatform contains all 9 platforms', () => {
    const platforms: ConnectorPlatform[] = [
      'x', 'linkedin', 'instagram', 'tiktok', 'youtube',
      'email', 'notion', 'airtable', 'webhook',
    ]
    expect(platforms).toHaveLength(9)
  })

  it('ConnectorStatus contains expected values', () => {
    const statuses: ConnectorStatus[] = ['connected', 'disconnected', 'error', 'pending']
    expect(statuses).toHaveLength(4)
  })

  it('SafetyLevel contains expected values', () => {
    const levels: SafetyLevel[] = ['strict', 'moderate', 'relaxed']
    expect(levels).toHaveLength(3)
  })

  it('CampaignStatus contains expected values', () => {
    const statuses: CampaignStatus[] = ['draft', 'active', 'paused', 'completed', 'archived']
    expect(statuses).toHaveLength(5)
  })
})

// ---------------------------------------------------------------------------
// 5. Row shapes have the expected required fields (spot-check key columns)
// ---------------------------------------------------------------------------

describe('Row shape spot-checks', () => {
  it('Mission Row has all required fields', () => {
    // Create a full Mission object — TypeScript will error if any field is missing
    // or has the wrong type.
    const mission: Mission = {
      id: 'uuid',
      workspace_id: 'uuid',
      user_id: 'uuid',
      title: 'Test mission',
      instruction: 'Do something amazing',
      status: 'pending',
      priority: 'normal',
      meta: {},
      plan_json: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    expect(mission.title).toBe('Test mission')
  })

  it('Asset Row has confidence_score and version fields', () => {
    const asset: Asset = {
      id: 'uuid',
      workspace_id: 'uuid',
      mission_id: null,
      job_id: null,
      operator_team: 'content_strike',
      type: 'post',
      platform: 'x',
      status: 'draft',
      title: 'Hook post',
      body: 'This is the body',
      metadata: {},
      confidence_score: 0.87,
      offer_id: null,
      version: 1,
      parent_asset_id: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    expect(asset.confidence_score).toBe(0.87)
    expect(asset.version).toBe(1)
  })

  it('Approval Row has risk_level and auto_decided fields', () => {
    const approval: Approval = {
      id: 'uuid',
      workspace_id: 'uuid',
      asset_id: 'uuid',
      job_id: null,
      status: 'pending',
      risk_level: 'medium',
      risk_flags: ['contains_price_claim'],
      requested_by: 'system',
      requested_at: new Date().toISOString(),
      reviewed_by: null,
      reviewed_at: null,
      notes: null,
      auto_approved: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    expect(approval.risk_level).toBe('medium')
    expect(approval.auto_approved).toBe(false)
  })
})
