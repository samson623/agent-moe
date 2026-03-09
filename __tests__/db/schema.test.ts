/**
 * __tests__/db/schema.test.ts
 *
 * Schema validation tests for AGENT MOE Supabase migrations.
 *
 * These tests verify that all migration SQL files:
 *   - Exist on disk
 *   - Contain the correct table definitions
 *   - Define all required columns
 *   - Declare all required enums
 *   - Implement Row Level Security (RLS)
 *   - Include all required indexes
 *   - Contain expected RLS policy names
 *
 * Run: pnpm test __tests__/db/schema.test.ts
 */

import fs from 'fs';
import path from 'path';

// ============================================================================
// Helpers
// ============================================================================

const MIGRATIONS_DIR = path.resolve(__dirname, '../../supabase/migrations');

/**
 * Reads a migration file and returns its content as a lowercase string.
 * Lowercasing allows case-insensitive substring assertions.
 */
function readMigration(filename: string): string {
  const filePath = path.join(MIGRATIONS_DIR, filename);
  expect(fs.existsSync(filePath)).toBe(true);
  return fs.readFileSync(filePath, 'utf-8').toLowerCase();
}

/**
 * Returns true if the SQL content contains the given substring (case-insensitive).
 */
function contains(sql: string, substring: string): boolean {
  return sql.includes(substring.toLowerCase());
}

/**
 * Asserts that the SQL content contains all given substrings.
 */
function expectAll(sql: string, substrings: string[], context: string): void {
  substrings.forEach((s) => {
    expect({ found: contains(sql, s), substring: s, context }).toEqual({
      found: true,
      substring: s,
      context,
    });
  });
}

// ============================================================================
// File existence tests
// ============================================================================

describe('Migration files exist', () => {
  const expectedFiles = [
    '00001_create_users.sql',
    '00002_create_workspaces.sql',
    '00003_create_brand_rules.sql',
    '00004_create_missions.sql',
    '00005_create_jobs.sql',
    '00006_create_assets.sql',
    '00007_create_offers.sql',
    '00008_create_approvals.sql',
    '00009_create_connectors.sql',
    '00010_create_analytics_events.sql',
    '00011_create_activity_logs.sql',
    '00012_create_launch_campaigns.sql',
    '00013_create_functions_and_triggers.sql',
    '00014_create_realtime_and_rls_policies.sql',
    '00015_seed_initial_data.sql',
  ];

  expectedFiles.forEach((filename) => {
    it(`exists: ${filename}`, () => {
      const filePath = path.join(MIGRATIONS_DIR, filename);
      expect(fs.existsSync(filePath)).toBe(true);
    });
  });

  it('migrations directory exists', () => {
    expect(fs.existsSync(MIGRATIONS_DIR)).toBe(true);
  });

  it('all migration files are non-empty', () => {
    expectedFiles.forEach((filename) => {
      const filePath = path.join(MIGRATIONS_DIR, filename);
      if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        expect(stats.size).toBeGreaterThan(100);
      }
    });
  });
});

// ============================================================================
// 00001: users table
// ============================================================================

describe('00001_create_users.sql', () => {
  let sql: string;

  beforeAll(() => {
    sql = readMigration('00001_create_users.sql');
  });

  it('creates the users table', () => {
    expect(contains(sql, 'create table')).toBe(true);
    expect(contains(sql, 'public.users')).toBe(true);
  });

  it('has required columns', () => {
    expectAll(sql, ['id', 'email', 'full_name', 'avatar_url', 'created_at', 'updated_at'], 'users columns');
  });

  it('uses UUID primary key with gen_random_uuid()', () => {
    expect(contains(sql, 'uuid primary key')).toBe(true);
    expect(contains(sql, 'gen_random_uuid()')).toBe(true);
  });

  it('has timestamptz created_at and updated_at', () => {
    expect(contains(sql, 'timestamptz')).toBe(true);
  });

  it('enables RLS', () => {
    expect(contains(sql, 'enable row level security')).toBe(true);
  });

  it('has required RLS policies', () => {
    expectAll(sql, [
      'users_select_own',
      'users_insert_own',
      'users_update_own',
    ], 'users RLS policies');
  });

  it('has email index', () => {
    expect(contains(sql, 'idx_users_email')).toBe(true);
  });

  it('requires uuid-ossp extension', () => {
    expect(contains(sql, 'uuid-ossp')).toBe(true);
  });
});

// ============================================================================
// 00002: workspaces table
// ============================================================================

describe('00002_create_workspaces.sql', () => {
  let sql: string;

  beforeAll(() => {
    sql = readMigration('00002_create_workspaces.sql');
  });

  it('creates the workspaces table', () => {
    expect(contains(sql, 'create table')).toBe(true);
    expect(contains(sql, 'public.workspaces')).toBe(true);
  });

  it('has required columns', () => {
    expectAll(sql, [
      'id', 'user_id', 'name', 'slug', 'settings', 'active_offer_id',
      'created_at', 'updated_at',
    ], 'workspaces columns');
  });

  it('has FK to users with CASCADE', () => {
    expect(contains(sql, 'references public.users(id)')).toBe(true);
    expect(contains(sql, 'on delete cascade')).toBe(true);
  });

  it('settings column is JSONB', () => {
    expect(contains(sql, 'jsonb')).toBe(true);
  });

  it('slug has unique constraint', () => {
    expect(contains(sql, 'unique')).toBe(true);
  });

  it('enables RLS', () => {
    expect(contains(sql, 'enable row level security')).toBe(true);
  });

  it('has required RLS policies', () => {
    expectAll(sql, [
      'workspaces_select_owner',
      'workspaces_insert_owner',
      'workspaces_update_owner',
      'workspaces_delete_owner',
    ], 'workspaces RLS policies');
  });

  it('has workspace indexes', () => {
    expectAll(sql, [
      'idx_workspaces_user_id',
      'idx_workspaces_slug',
    ], 'workspaces indexes');
  });
});

// ============================================================================
// 00003: brand_rules table
// ============================================================================

describe('00003_create_brand_rules.sql', () => {
  let sql: string;

  beforeAll(() => {
    sql = readMigration('00003_create_brand_rules.sql');
  });

  it('creates the brand_rules table', () => {
    expect(contains(sql, 'public.brand_rules')).toBe(true);
  });

  it('creates the safety_level enum', () => {
    expect(contains(sql, 'create type public.safety_level as enum')).toBe(true);
    expectAll(sql, ['strict', 'moderate', 'relaxed'], 'safety_level enum values');
  });

  it('has required columns', () => {
    expectAll(sql, [
      'workspace_id', 'tone_voice', 'blocked_phrases', 'safety_level',
      'auto_approve_threshold', 'brand_guidelines',
    ], 'brand_rules columns');
  });

  it('blocked_phrases is an array type', () => {
    expect(contains(sql, 'text[]')).toBe(true);
  });

  it('auto_approve_threshold has range check constraint', () => {
    expect(contains(sql, 'check')).toBe(true);
    expect(contains(sql, '0.0')).toBe(true);
    expect(contains(sql, '1.0')).toBe(true);
  });

  it('has unique constraint on workspace_id', () => {
    expect(contains(sql, 'brand_rules_workspace_unique')).toBe(true);
  });

  it('enables RLS', () => {
    expect(contains(sql, 'enable row level security')).toBe(true);
  });

  it('has required RLS policies', () => {
    expectAll(sql, [
      'brand_rules_select_owner',
      'brand_rules_insert_owner',
      'brand_rules_update_owner',
      'brand_rules_delete_owner',
    ], 'brand_rules RLS policies');
  });
});

// ============================================================================
// 00004: missions table
// ============================================================================

describe('00004_create_missions.sql', () => {
  let sql: string;

  beforeAll(() => {
    sql = readMigration('00004_create_missions.sql');
  });

  it('creates mission_status enum with all values', () => {
    expect(contains(sql, 'create type public.mission_status as enum')).toBe(true);
    expectAll(sql, [
      'pending', 'planning', 'running', 'paused', 'completed', 'failed',
    ], 'mission_status enum values');
  });

  it('creates mission_priority enum with all values', () => {
    expect(contains(sql, 'create type public.mission_priority as enum')).toBe(true);
    expectAll(sql, ['low', 'normal', 'high', 'urgent'], 'mission_priority enum values');
  });

  it('creates the missions table', () => {
    expect(contains(sql, 'public.missions')).toBe(true);
  });

  it('has required columns', () => {
    expectAll(sql, [
      'id', 'workspace_id', 'user_id', 'title', 'instruction',
      'status', 'priority', 'plan_json', 'meta', 'created_at', 'updated_at',
    ], 'missions columns');
  });

  it('plan_json and meta are JSONB', () => {
    expect(sql.match(/jsonb/g)?.length).toBeGreaterThanOrEqual(2);
  });

  it('has FK to workspaces and users', () => {
    expect(contains(sql, 'references public.workspaces(id)')).toBe(true);
    expect(contains(sql, 'references public.users(id)')).toBe(true);
  });

  it('enables RLS', () => {
    expect(contains(sql, 'enable row level security')).toBe(true);
  });

  it('has required RLS policies', () => {
    expectAll(sql, [
      'missions_select_owner',
      'missions_insert_owner',
      'missions_update_owner',
      'missions_delete_owner',
    ], 'missions RLS policies');
  });

  it('has required indexes', () => {
    expectAll(sql, [
      'idx_missions_workspace_created',
      'idx_missions_status',
      'idx_missions_workspace_status',
    ], 'missions indexes');
  });
});

// ============================================================================
// 00005: jobs table
// ============================================================================

describe('00005_create_jobs.sql', () => {
  let sql: string;

  beforeAll(() => {
    sql = readMigration('00005_create_jobs.sql');
  });

  it('creates operator_team enum with all four teams', () => {
    expect(contains(sql, 'create type public.operator_team as enum')).toBe(true);
    expectAll(sql, [
      'content_strike', 'growth_operator', 'revenue_closer', 'brand_guardian',
    ], 'operator_team enum values');
  });

  it('creates job_status enum with all values', () => {
    expect(contains(sql, 'create type public.job_status as enum')).toBe(true);
    expectAll(sql, [
      'pending', 'running', 'completed', 'failed', 'cancelled',
    ], 'job_status enum values');
  });

  it('creates model_used enum', () => {
    expect(contains(sql, 'create type public.model_used as enum')).toBe(true);
    expectAll(sql, ['claude', 'gpt5_nano'], 'model_used enum values');
  });

  it('creates the jobs table', () => {
    expect(contains(sql, 'public.jobs')).toBe(true);
  });

  it('has required columns', () => {
    expectAll(sql, [
      'id', 'mission_id', 'workspace_id', 'operator_team', 'job_type',
      'title', 'description', 'status', 'priority', 'depends_on',
      'model_used', 'input_data', 'output_data', 'error_message',
      'started_at', 'completed_at', 'created_at', 'updated_at',
    ], 'jobs columns');
  });

  it('depends_on is a UUID array', () => {
    expect(contains(sql, 'uuid[]')).toBe(true);
  });

  it('has FK to missions and workspaces', () => {
    expect(contains(sql, 'references public.missions(id)')).toBe(true);
    expect(contains(sql, 'references public.workspaces(id)')).toBe(true);
  });

  it('enables RLS', () => {
    expect(contains(sql, 'enable row level security')).toBe(true);
  });

  it('has required RLS policies', () => {
    expectAll(sql, [
      'jobs_select_owner',
      'jobs_insert_owner',
      'jobs_update_owner',
      'jobs_delete_owner',
    ], 'jobs RLS policies');
  });

  it('has required indexes', () => {
    expectAll(sql, [
      'idx_jobs_mission_id',
      'idx_jobs_status_priority',
      'idx_jobs_workspace_status',
      'idx_jobs_operator_team',
    ], 'jobs indexes');
  });
});

// ============================================================================
// 00006: assets table
// ============================================================================

describe('00006_create_assets.sql', () => {
  let sql: string;

  beforeAll(() => {
    sql = readMigration('00006_create_assets.sql');
  });

  it('creates asset_type enum with all values', () => {
    expect(contains(sql, 'create type public.asset_type as enum')).toBe(true);
    expectAll(sql, [
      'post', 'thread', 'script', 'caption', 'cta',
      'thumbnail_concept', 'carousel', 'video_concept', 'email', 'report',
    ], 'asset_type enum values');
  });

  it('creates asset_platform enum with all values', () => {
    expect(contains(sql, 'create type public.asset_platform as enum')).toBe(true);
    expectAll(sql, [
      'x', 'linkedin', 'instagram', 'tiktok', 'youtube', 'email', 'universal',
    ], 'asset_platform enum values');
  });

  it('creates asset_status enum with all values', () => {
    expect(contains(sql, 'create type public.asset_status as enum')).toBe(true);
    expectAll(sql, [
      'draft', 'review', 'approved', 'published', 'archived', 'rejected',
    ], 'asset_status enum values');
  });

  it('creates the assets table', () => {
    expect(contains(sql, 'public.assets')).toBe(true);
  });

  it('has required columns', () => {
    expectAll(sql, [
      'id', 'workspace_id', 'mission_id', 'job_id', 'operator_team',
      'asset_type', 'platform', 'title', 'content', 'metadata', 'status',
      'confidence_score', 'version', 'parent_asset_id', 'linked_offer_id',
      'created_at', 'updated_at',
    ], 'assets columns');
  });

  it('has self-referential FK for versioning', () => {
    expect(contains(sql, 'references public.assets(id)')).toBe(true);
  });

  it('confidence_score has range check', () => {
    expect(contains(sql, 'confidence_score')).toBe(true);
    expect(contains(sql, 'check')).toBe(true);
  });

  it('enables RLS', () => {
    expect(contains(sql, 'enable row level security')).toBe(true);
  });

  it('has required RLS policies', () => {
    expectAll(sql, [
      'assets_select_owner',
      'assets_insert_owner',
      'assets_update_owner',
      'assets_delete_owner',
    ], 'assets RLS policies');
  });

  it('has required indexes', () => {
    expectAll(sql, [
      'idx_assets_workspace_status',
      'idx_assets_workspace_type',
      'idx_assets_workspace_platform',
      'idx_assets_mission_id',
    ], 'assets indexes');
  });
});

// ============================================================================
// 00007: offers table
// ============================================================================

describe('00007_create_offers.sql', () => {
  let sql: string;

  beforeAll(() => {
    sql = readMigration('00007_create_offers.sql');
  });

  it('creates offer_type enum with all values', () => {
    expect(contains(sql, 'create type public.offer_type as enum')).toBe(true);
    expectAll(sql, [
      'product', 'service', 'lead_magnet', 'course',
      'consultation', 'subscription', 'affiliate',
    ], 'offer_type enum values');
  });

  it('creates offer_status enum with all values', () => {
    expect(contains(sql, 'create type public.offer_status as enum')).toBe(true);
    expectAll(sql, ['active', 'inactive', 'archived'], 'offer_status enum values');
  });

  it('creates the offers table', () => {
    expect(contains(sql, 'public.offers')).toBe(true);
  });

  it('has required columns', () => {
    expectAll(sql, [
      'id', 'workspace_id', 'name', 'description', 'offer_type',
      'price_cents', 'currency', 'cta_text', 'cta_url', 'status', 'meta',
      'created_at', 'updated_at',
    ], 'offers columns');
  });

  it('price_cents is bigint and nullable', () => {
    expect(contains(sql, 'bigint')).toBe(true);
  });

  it('patches circular FK on workspaces.active_offer_id', () => {
    expect(contains(sql, 'workspaces_active_offer_id_fk')).toBe(true);
  });

  it('patches FK on assets.linked_offer_id', () => {
    expect(contains(sql, 'assets_linked_offer_id_fk')).toBe(true);
  });

  it('enables RLS', () => {
    expect(contains(sql, 'enable row level security')).toBe(true);
  });

  it('has required RLS policies', () => {
    expectAll(sql, [
      'offers_select_owner',
      'offers_insert_owner',
      'offers_update_owner',
      'offers_delete_owner',
    ], 'offers RLS policies');
  });

  it('has indexes', () => {
    expectAll(sql, [
      'idx_offers_workspace_status',
      'idx_offers_workspace_type',
    ], 'offers indexes');
  });
});

// ============================================================================
// 00008: approvals table
// ============================================================================

describe('00008_create_approvals.sql', () => {
  let sql: string;

  beforeAll(() => {
    sql = readMigration('00008_create_approvals.sql');
  });

  it('creates approval_status enum with all values', () => {
    expect(contains(sql, 'create type public.approval_status as enum')).toBe(true);
    expectAll(sql, [
      'pending', 'approved', 'rejected', 'revision_requested',
    ], 'approval_status enum values');
  });

  it('creates risk_level enum with all values', () => {
    expect(contains(sql, 'create type public.risk_level as enum')).toBe(true);
    expectAll(sql, ['low', 'medium', 'high', 'critical'], 'risk_level enum values');
  });

  it('creates the approvals table', () => {
    expect(contains(sql, 'public.approvals')).toBe(true);
  });

  it('has required columns', () => {
    expectAll(sql, [
      'id', 'workspace_id', 'asset_id', 'job_id', 'requested_by',
      'reviewed_by', 'status', 'risk_level', 'risk_flags', 'notes',
      'auto_approved', 'requested_at', 'reviewed_at',
    ], 'approvals columns');
  });

  it('risk_flags is a text array', () => {
    expect(contains(sql, 'text[]')).toBe(true);
  });

  it('auto_approved is boolean', () => {
    expect(contains(sql, 'boolean')).toBe(true);
  });

  it('has target_required constraint (asset_id or job_id must be set)', () => {
    expect(contains(sql, 'approvals_target_required')).toBe(true);
  });

  it('enables RLS', () => {
    expect(contains(sql, 'enable row level security')).toBe(true);
  });

  it('has required RLS policies', () => {
    expectAll(sql, [
      'approvals_select_owner',
      'approvals_insert_owner',
      'approvals_update_owner',
      'approvals_delete_owner',
    ], 'approvals RLS policies');
  });

  it('has required indexes', () => {
    expectAll(sql, [
      'idx_approvals_workspace_status',
      'idx_approvals_pending',
      'idx_approvals_risk_level',
    ], 'approvals indexes');
  });
});

// ============================================================================
// 00009: connectors table
// ============================================================================

describe('00009_create_connectors.sql', () => {
  let sql: string;

  beforeAll(() => {
    sql = readMigration('00009_create_connectors.sql');
  });

  it('creates connector_platform enum with all values', () => {
    expect(contains(sql, 'create type public.connector_platform as enum')).toBe(true);
    expectAll(sql, [
      'x', 'linkedin', 'instagram', 'tiktok', 'youtube',
      'email', 'notion', 'airtable', 'webhook',
    ], 'connector_platform enum values');
  });

  it('creates connector_status enum with all values', () => {
    expect(contains(sql, 'create type public.connector_status as enum')).toBe(true);
    expectAll(sql, [
      'connected', 'disconnected', 'error', 'pending',
    ], 'connector_status enum values');
  });

  it('creates the connectors table', () => {
    expect(contains(sql, 'public.connectors')).toBe(true);
  });

  it('has required columns', () => {
    expectAll(sql, [
      'id', 'workspace_id', 'platform', 'name', 'status',
      'credentials', 'config', 'last_sync_at', 'created_at', 'updated_at',
    ], 'connectors columns');
  });

  it('credentials column has security warning comment', () => {
    expect(contains(sql, 'encrypted')).toBe(true);
  });

  it('has unique constraint on workspace + platform', () => {
    expect(contains(sql, 'connectors_workspace_platform_unique')).toBe(true);
  });

  it('enables RLS', () => {
    expect(contains(sql, 'enable row level security')).toBe(true);
  });

  it('has required RLS policies', () => {
    expectAll(sql, [
      'connectors_select_owner',
      'connectors_insert_owner',
      'connectors_update_owner',
      'connectors_delete_owner',
    ], 'connectors RLS policies');
  });

  it('has indexes', () => {
    expectAll(sql, [
      'idx_connectors_workspace_id',
      'idx_connectors_workspace_platform',
    ], 'connectors indexes');
  });
});

// ============================================================================
// 00010: analytics_events table
// ============================================================================

describe('00010_create_analytics_events.sql', () => {
  let sql: string;

  beforeAll(() => {
    sql = readMigration('00010_create_analytics_events.sql');
  });

  it('creates the analytics_events table', () => {
    expect(contains(sql, 'public.analytics_events')).toBe(true);
  });

  it('uses BIGSERIAL for id', () => {
    expect(contains(sql, 'bigserial')).toBe(true);
  });

  it('has required columns', () => {
    expectAll(sql, [
      'id', 'workspace_id', 'event_type', 'entity_type',
      'entity_id', 'properties', 'occurred_at', 'created_at',
    ], 'analytics_events columns');
  });

  it('properties is JSONB', () => {
    expect(contains(sql, 'jsonb')).toBe(true);
  });

  it('enables RLS', () => {
    expect(contains(sql, 'enable row level security')).toBe(true);
  });

  it('has SELECT and INSERT policies (append-only, no UPDATE/DELETE)', () => {
    expect(contains(sql, 'analytics_events_select_owner')).toBe(true);
    expect(contains(sql, 'analytics_events_insert_owner')).toBe(true);
  });

  it('has required indexes', () => {
    expectAll(sql, [
      'idx_analytics_events_workspace_occurred',
      'idx_analytics_events_workspace_type',
      'idx_analytics_events_entity',
    ], 'analytics_events indexes');
  });
});

// ============================================================================
// 00011: activity_logs table
// ============================================================================

describe('00011_create_activity_logs.sql', () => {
  let sql: string;

  beforeAll(() => {
    sql = readMigration('00011_create_activity_logs.sql');
  });

  it('creates the activity_logs table', () => {
    expect(contains(sql, 'public.activity_logs')).toBe(true);
  });

  it('uses BIGSERIAL for id', () => {
    expect(contains(sql, 'bigserial')).toBe(true);
  });

  it('has required columns', () => {
    expectAll(sql, [
      'id', 'workspace_id', 'actor', 'action', 'entity_type',
      'entity_id', 'message', 'meta', 'occurred_at',
    ], 'activity_logs columns');
  });

  it('enables RLS', () => {
    expect(contains(sql, 'enable row level security')).toBe(true);
  });

  it('has SELECT and INSERT policies (append-only)', () => {
    expect(contains(sql, 'activity_logs_select_owner')).toBe(true);
    expect(contains(sql, 'activity_logs_insert_owner')).toBe(true);
  });

  it('has required indexes', () => {
    expectAll(sql, [
      'idx_activity_logs_workspace_occurred',
      'idx_activity_logs_workspace_actor',
      'idx_activity_logs_entity',
    ], 'activity_logs indexes');
  });
});

// ============================================================================
// 00012: launch_campaigns table
// ============================================================================

describe('00012_create_launch_campaigns.sql', () => {
  let sql: string;

  beforeAll(() => {
    sql = readMigration('00012_create_launch_campaigns.sql');
  });

  it('creates campaign_status enum with all values', () => {
    expect(contains(sql, 'create type public.campaign_status as enum')).toBe(true);
    expectAll(sql, [
      'draft', 'active', 'paused', 'completed', 'archived',
    ], 'campaign_status enum values');
  });

  it('creates the launch_campaigns table', () => {
    expect(contains(sql, 'public.launch_campaigns')).toBe(true);
  });

  it('has required columns', () => {
    expectAll(sql, [
      'id', 'workspace_id', 'name', 'description', 'status',
      'launch_date', 'end_date', 'mission_ids', 'asset_ids',
      'offer_id', 'timeline', 'meta', 'created_at', 'updated_at',
    ], 'launch_campaigns columns');
  });

  it('mission_ids and asset_ids are UUID arrays', () => {
    expect(sql.match(/uuid\[\]/g)?.length).toBeGreaterThanOrEqual(2);
  });

  it('timeline is JSONB', () => {
    expect(contains(sql, 'jsonb')).toBe(true);
  });

  it('has FK to offers (nullable)', () => {
    expect(contains(sql, 'references public.offers(id)')).toBe(true);
    expect(contains(sql, 'on delete set null')).toBe(true);
  });

  it('has date range constraint', () => {
    expect(contains(sql, 'launch_campaigns_date_range')).toBe(true);
  });

  it('enables RLS', () => {
    expect(contains(sql, 'enable row level security')).toBe(true);
  });

  it('has required RLS policies', () => {
    expectAll(sql, [
      'launch_campaigns_select_owner',
      'launch_campaigns_insert_owner',
      'launch_campaigns_update_owner',
      'launch_campaigns_delete_owner',
    ], 'launch_campaigns RLS policies');
  });

  it('has required indexes', () => {
    expectAll(sql, [
      'idx_launch_campaigns_workspace_status',
      'idx_launch_campaigns_launch_date',
    ], 'launch_campaigns indexes');
  });
});

// ============================================================================
// 00013: Functions and Triggers
// ============================================================================

describe('00013_create_functions_and_triggers.sql', () => {
  let sql: string;

  beforeAll(() => {
    sql = readMigration('00013_create_functions_and_triggers.sql');
  });

  it('creates the set_updated_at function', () => {
    expect(contains(sql, 'create or replace function public.set_updated_at()')).toBe(true);
  });

  it('applies updated_at trigger to all mutable tables', () => {
    const tables = [
      'users', 'workspaces', 'brand_rules', 'missions', 'jobs',
      'assets', 'offers', 'approvals', 'connectors', 'launch_campaigns',
    ];
    tables.forEach((table) => {
      expect(contains(sql, `trg_${table}_updated_at`)).toBe(true);
    });
  });

  it('creates handle_new_auth_user function', () => {
    expect(contains(sql, 'public.handle_new_auth_user()')).toBe(true);
  });

  it('handle_new_auth_user creates workspace and brand_rules', () => {
    expect(contains(sql, 'public.workspaces')).toBe(true);
    expect(contains(sql, 'public.brand_rules')).toBe(true);
  });

  it('trigger fires on auth.users insert', () => {
    expect(contains(sql, 'after insert on auth.users')).toBe(true);
    expect(contains(sql, 'trg_on_auth_user_created')).toBe(true);
  });

  it('creates log_mission_status_change function', () => {
    expect(contains(sql, 'public.log_mission_status_change()')).toBe(true);
  });

  it('mission status trigger fires on status column update', () => {
    expect(contains(sql, 'trg_mission_status_change')).toBe(true);
    expect(contains(sql, 'after update of status on public.missions')).toBe(true);
  });

  it('creates log_job_status_change function', () => {
    expect(contains(sql, 'public.log_job_status_change()')).toBe(true);
  });

  it('job status trigger fires on status column update', () => {
    expect(contains(sql, 'trg_job_status_change')).toBe(true);
    expect(contains(sql, 'after update of status on public.jobs')).toBe(true);
  });

  it('logs to activity_logs from trigger functions', () => {
    expect(contains(sql, 'public.activity_logs')).toBe(true);
    expect(contains(sql, 'insert into public.activity_logs')).toBe(true);
  });

  it('all functions use SECURITY DEFINER', () => {
    expect(sql.match(/security definer/g)?.length).toBeGreaterThanOrEqual(4);
  });

  it('functions have exception handling', () => {
    expect(contains(sql, 'exception when others')).toBe(true);
  });
});

// ============================================================================
// 00014: Realtime and RLS policies
// ============================================================================

describe('00014_create_realtime_and_rls_policies.sql', () => {
  let sql: string;

  beforeAll(() => {
    sql = readMigration('00014_create_realtime_and_rls_policies.sql');
  });

  it('enables realtime for missions', () => {
    expect(contains(sql, 'supabase_realtime add table public.missions')).toBe(true);
  });

  it('enables realtime for jobs', () => {
    expect(contains(sql, 'supabase_realtime add table public.jobs')).toBe(true);
  });

  it('enables realtime for assets', () => {
    expect(contains(sql, 'supabase_realtime add table public.assets')).toBe(true);
  });

  it('enables realtime for approvals', () => {
    expect(contains(sql, 'supabase_realtime add table public.approvals')).toBe(true);
  });

  it('enables realtime for activity_logs', () => {
    expect(contains(sql, 'supabase_realtime add table public.activity_logs')).toBe(true);
  });

  it('grants usage on public schema to authenticated', () => {
    expect(contains(sql, 'grant usage on schema public to authenticated')).toBe(true);
  });

  it('grants table permissions to authenticated role', () => {
    expect(contains(sql, 'to authenticated')).toBe(true);
  });

  it('sets REPLICA IDENTITY FULL for realtime tables', () => {
    expect(contains(sql, 'replica identity full')).toBe(true);
    expect(contains(sql, 'alter table public.missions')).toBe(true);
    expect(contains(sql, 'alter table public.jobs')).toBe(true);
    expect(contains(sql, 'alter table public.assets')).toBe(true);
  });

  it('creates is_workspace_owner helper function', () => {
    expect(contains(sql, 'public.is_workspace_owner')).toBe(true);
  });

  it('has RLS verification block', () => {
    expect(contains(sql, 'relrowsecurity')).toBe(true);
  });
});

// ============================================================================
// 00015: Seed data
// ============================================================================

describe('00015_seed_initial_data.sql', () => {
  let sql: string;

  beforeAll(() => {
    sql = readMigration('00015_seed_initial_data.sql');
  });

  it('seeds offers for the first workspace', () => {
    expect(contains(sql, 'public.offers')).toBe(true);
    expect(contains(sql, 'insert into public.offers')).toBe(true);
  });

  it('seeds at least 3 offers', () => {
    const offerInserts = (sql.match(/insert into public\.offers/g) || []).length;
    expect(offerInserts).toBeGreaterThanOrEqual(3);
  });

  it('includes a consultation offer', () => {
    expect(contains(sql, 'consultation')).toBe(true);
  });

  it('includes a course offer', () => {
    expect(contains(sql, 'course')).toBe(true);
  });

  it('includes a lead_magnet offer', () => {
    expect(contains(sql, 'lead_magnet')).toBe(true);
  });

  it('uses ON CONFLICT DO NOTHING (idempotent)', () => {
    expect(contains(sql, 'on conflict do nothing')).toBe(true);
  });

  it('seeds an activity_log entry', () => {
    expect(contains(sql, 'insert into public.activity_logs')).toBe(true);
    expect(contains(sql, 'platform.seeded')).toBe(true);
  });

  it('handles case where no workspace exists gracefully', () => {
    expect(contains(sql, 'if v_workspace_id is null')).toBe(true);
  });
});

// ============================================================================
// Cross-cutting: Universal standards
// ============================================================================

describe('Universal schema standards (all migrations)', () => {
  const tableMigrations = [
    '00001_create_users.sql',
    '00002_create_workspaces.sql',
    '00003_create_brand_rules.sql',
    '00004_create_missions.sql',
    '00005_create_jobs.sql',
    '00006_create_assets.sql',
    '00007_create_offers.sql',
    '00008_create_approvals.sql',
    '00009_create_connectors.sql',
    '00010_create_analytics_events.sql',
    '00011_create_activity_logs.sql',
    '00012_create_launch_campaigns.sql',
  ];

  tableMigrations.forEach((filename) => {
    describe(filename, () => {
      let sql: string;

      beforeAll(() => {
        sql = readMigration(filename);
      });

      it('has an id column (UUID or BIGSERIAL)', () => {
        const hasUuid = contains(sql, 'uuid primary key');
        const hasBigserial = contains(sql, 'bigserial primary key');
        expect(hasUuid || hasBigserial).toBe(true);
      });

      it('has created_at (or occurred_at) with NOT NULL and DEFAULT NOW()', () => {
        const hasCreatedAt = contains(sql, 'created_at');
        const hasOccurredAt = contains(sql, 'occurred_at');
        expect(hasCreatedAt || hasOccurredAt).toBe(true);
        expect(contains(sql, 'not null')).toBe(true);
        expect(contains(sql, 'default now()')).toBe(true);
      });

      it('enables row level security', () => {
        expect(contains(sql, 'enable row level security')).toBe(true);
      });

      it('has at least one RLS SELECT policy', () => {
        expect(contains(sql, 'for select')).toBe(true);
      });

      it('has at least one named index', () => {
        expect(contains(sql, 'create index')).toBe(true);
      });

      it('has at least one comment', () => {
        expect(contains(sql, 'comment on')).toBe(true);
      });
    });
  });
});

// ============================================================================
// supabase/config.toml existence
// ============================================================================

describe('supabase/config.toml', () => {
  const configPath = path.resolve(__dirname, '../../supabase/config.toml');

  it('config.toml exists', () => {
    expect(fs.existsSync(configPath)).toBe(true);
  });

  it('defines API port', () => {
    const content = fs.readFileSync(configPath, 'utf-8');
    expect(content).toContain('[api]');
    expect(content).toContain('port = 54321');
  });

  it('defines DB port', () => {
    const content = fs.readFileSync(configPath, 'utf-8');
    expect(content).toContain('[db]');
    expect(content).toContain('port = 5432');
  });

  it('defines Studio port', () => {
    const content = fs.readFileSync(configPath, 'utf-8');
    expect(content).toContain('[studio]');
    expect(content).toContain('port = 54323');
  });

  it('defines Inbucket port', () => {
    const content = fs.readFileSync(configPath, 'utf-8');
    expect(content).toContain('[inbucket]');
    expect(content).toContain('port = 54324');
  });
});
