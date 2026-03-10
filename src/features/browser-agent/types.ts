import { z } from 'zod'

export type BrowserTaskType =
  | 'scrape'
  | 'screenshot'
  | 'click'
  | 'fill_form'
  | 'navigate'
  | 'monitor'
  | 'extract_data'
  | 'submit_form'

export type BrowserTaskStatus =
  | 'pending'
  | 'running'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'timeout'

export type BrowserType = 'chromium' | 'firefox' | 'webkit'

export interface BrowserTaskConfig {
  selectors?: Record<string, string>
  timeout_ms?: number
  max_retries?: number
  viewport?: { width: number; height: number }
  wait_for?: 'load' | 'domcontentloaded' | 'networkidle'
  capture_screenshot?: boolean
  extract_fields?: string[]
  form_data?: Record<string, string>
  click_selector?: string
  scroll_to_bottom?: boolean
  user_agent?: string
}

export interface BrowserTaskInput {
  workspace_id: string
  mission_id?: string
  job_id?: string
  task_type: BrowserTaskType
  url: string
  instructions: string
  config?: BrowserTaskConfig
  priority?: number
  max_retries?: number
  timeout_ms?: number
}

export interface BrowserTaskResult {
  success: boolean
  data?: Record<string, unknown>
  text_content?: string
  html_snapshot?: string
  links?: string[]
  screenshot_path?: string
  error?: string
  execution_time_ms?: number
  page_title?: string
  final_url?: string
}

export interface BrowserTask {
  id: string
  workspace_id: string
  mission_id?: string
  job_id?: string
  task_type: BrowserTaskType
  status: BrowserTaskStatus
  priority: number
  url: string
  instructions: string
  config: BrowserTaskConfig
  result?: BrowserTaskResult
  screenshot_url?: string
  error_message?: string
  retry_count: number
  max_retries: number
  started_at?: string
  completed_at?: string
  timeout_ms: number
  created_at: string
  updated_at: string
}

export interface BrowserTaskStats {
  total: number
  pending: number
  running: number
  completed: number
  failed: number
  cancelled: number
  timeout: number
  completed_today: number
}

// Zod schemas

export const BrowserTaskConfigSchema = z.object({
  selectors: z.record(z.string()).optional(),
  timeout_ms: z.number().positive().optional(),
  max_retries: z.number().min(0).max(10).optional(),
  viewport: z.object({ width: z.number(), height: z.number() }).optional(),
  wait_for: z.enum(['load', 'domcontentloaded', 'networkidle']).optional(),
  capture_screenshot: z.boolean().optional(),
  extract_fields: z.array(z.string()).optional(),
  form_data: z.record(z.string()).optional(),
  click_selector: z.string().optional(),
  scroll_to_bottom: z.boolean().optional(),
  user_agent: z.string().optional(),
})

export const BrowserTaskInputSchema = z.object({
  workspace_id: z.string().uuid(),
  mission_id: z.string().uuid().optional(),
  job_id: z.string().uuid().optional(),
  task_type: z.enum(['scrape', 'screenshot', 'click', 'fill_form', 'navigate', 'monitor', 'extract_data', 'submit_form']),
  url: z.string().url(),
  instructions: z.string().min(1).max(2000),
  config: BrowserTaskConfigSchema.optional(),
  priority: z.number().min(1).max(10).optional(),
  max_retries: z.number().min(0).max(10).optional(),
  timeout_ms: z.number().min(1000).max(300000).optional(),
})

export const BrowserTaskResultSchema = z.object({
  success: z.boolean(),
  data: z.record(z.unknown()).optional(),
  text_content: z.string().optional(),
  html_snapshot: z.string().optional(),
  links: z.array(z.string()).optional(),
  screenshot_path: z.string().optional(),
  error: z.string().optional(),
  execution_time_ms: z.number().optional(),
  page_title: z.string().optional(),
  final_url: z.string().optional(),
})
