/* Vercel stub — browser agent operator cannot run in serverless (no Playwright) */
import { BaseOperator } from '@/features/ai/operators/base-operator'
import {
  type ExecutionResult,
  type Job,
  JobType,
  ModelChoice,
  OperatorTeam,
} from '@/features/ai/types'

export interface BrowserOutput {
  task_id: string
  task_type: string
  url: string
  success: boolean
  error?: string
}

export class BrowserAgentOperator extends BaseOperator {
  constructor() {
    super(OperatorTeam.BROWSER_AGENT)
  }

  getSystemPrompt(): string {
    return 'Browser agent is unavailable on Vercel.'
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
    return {
      success: false,
      error: { code: 'UNAVAILABLE', message: 'Browser agent unavailable on Vercel', retryable: false },
      model: ModelChoice.CLAUDE,
      jobType: job.type,
      durationMs: 0,
      timestamp: new Date().toISOString(),
    }
  }
}
