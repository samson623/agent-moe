/**
 * BrowserAgentOperator — Playwright browser automation operator
 *
 * Handles all BROWSER_* job types. Maps job input to BrowserTaskInput,
 * creates a browser_tasks record, executes via BrowserRunner (Playwright),
 * and stores results back to DB.
 *
 * Part of the operator factory — registered as OperatorTeam.BROWSER_AGENT.
 */

import 'server-only'

import { BaseOperator } from '@/features/ai/operators/base-operator'
import {
  type ExecutionResult,
  type Job,
  JobType,
  ModelChoice,
  OperatorTeam,
} from '@/features/ai/types'
import type { BrowserTaskType } from './types'

// ---------------------------------------------------------------------------
// BrowserOutput — structured result from a browser task
// ---------------------------------------------------------------------------

export interface BrowserOutput {
  task_id: string
  task_type: BrowserTaskType
  url: string
  success: boolean
  data?: Record<string, unknown>
  text_content?: string
  links?: string[]
  page_title?: string
  final_url?: string
  execution_time_ms?: number
  error?: string
}

// ---------------------------------------------------------------------------
// BrowserAgentOperator
// ---------------------------------------------------------------------------

export class BrowserAgentOperator extends BaseOperator {
  constructor() {
    super(OperatorTeam.BROWSER_AGENT)
  }

  getSystemPrompt(): string {
    return `You are the Browser Agent — an expert in automated web research and data extraction.
You execute precise browser tasks using Playwright to gather intelligence from the web.
You can scrape pages, take screenshots, click elements, fill forms, extract structured data,
and monitor pages for changes. You always return clean, structured results that other operators
can act on. Be concise, accurate, and thorough.`
  }

  getSupportedJobTypes(): JobType[] {
    return [
      JobType.BROWSER_SCRAPE,
      JobType.BROWSER_SCREENSHOT,
      JobType.BROWSER_CLICK,
      JobType.BROWSER_FILL_FORM,
      JobType.BROWSER_NAVIGATE,
      JobType.BROWSER_MONITOR,
      JobType.BROWSER_EXTRACT_DATA,
      JobType.BROWSER_SUBMIT_FORM,
    ]
  }

  async execute(job: Job): Promise<ExecutionResult<BrowserOutput>> {
    const start = Date.now()

    if (!this.supportsJob(job.type)) {
      return this.unsupportedJobResult(job, start) as ExecutionResult<BrowserOutput>
    }

    this.log('browser_task_start', { jobId: job.id, jobType: job.type })

    try {
      const taskType = this.mapJobTypeToBrowserTaskType(job.type)
      const url = this.extractUrl(job)
      const instructions = this.extractInstructions(job)

      if (!url) {
        throw new Error('Browser job input must include a URL')
      }

      // BrowserRunner import is lazy to avoid loading Playwright on the module level
      // (Playwright only runs server-side and should not load in edge runtimes)
      const { BrowserRunner } = await import('./browser-runner')
      const runner = new BrowserRunner()

      await runner.launch()

      let result
      try {
        result = await runner.executeTask({
          id: job.id,
          workspace_id: job.missionId, // Use missionId as workspace proxy for standalone jobs
          task_type: taskType,
          status: 'running',
          priority: job.priority,
          url,
          instructions,
          config: this.extractConfig(job),
          retry_count: 0,
          max_retries: 3,
          timeout_ms: 30000,
          created_at: job.createdAt,
          updated_at: job.createdAt,
        })
      } finally {
        await runner.close()
      }

      const output: BrowserOutput = {
        task_id: job.id,
        task_type: taskType,
        url,
        success: result.success,
        data: result.data,
        text_content: result.text_content,
        links: result.links,
        page_title: result.page_title,
        final_url: result.final_url,
        execution_time_ms: result.execution_time_ms,
        error: result.error,
      }

      this.log('browser_task_complete', {
        jobId: job.id,
        success: result.success,
        durationMs: Date.now() - start,
      })

      return {
        success: true,
        data: output,
        model: ModelChoice.CLAUDE,
        jobType: job.type,
        durationMs: Date.now() - start,
        timestamp: new Date().toISOString(),
      }
    } catch (err) {
      return this.buildErrorResult(err, job.type, ModelChoice.CLAUDE, start) as ExecutionResult<BrowserOutput>
    }
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private mapJobTypeToBrowserTaskType(jobType: JobType): BrowserTaskType {
    const map: Partial<Record<JobType, BrowserTaskType>> = {
      [JobType.BROWSER_SCRAPE]:       'scrape',
      [JobType.BROWSER_SCREENSHOT]:   'screenshot',
      [JobType.BROWSER_CLICK]:        'click',
      [JobType.BROWSER_FILL_FORM]:    'fill_form',
      [JobType.BROWSER_NAVIGATE]:     'navigate',
      [JobType.BROWSER_MONITOR]:      'monitor',
      [JobType.BROWSER_EXTRACT_DATA]: 'extract_data',
      [JobType.BROWSER_SUBMIT_FORM]:  'submit_form',
    }
    return map[jobType] ?? 'scrape'
  }

  private extractUrl(job: Job): string {
    const input = job.input as unknown as Record<string, unknown>
    return (input['url'] as string | undefined) ?? ''
  }

  private extractInstructions(job: Job): string {
    const input = job.input as unknown as Record<string, unknown>
    const instructions = input['instructions'] as string | undefined
    const description = input['description'] as string | undefined
    return instructions ?? description ?? `Execute ${job.type} task`
  }

  private extractConfig(job: Job): Record<string, unknown> {
    const input = job.input as unknown as Record<string, unknown>
    return (input['config'] as Record<string, unknown> | undefined) ?? {}
  }
}
