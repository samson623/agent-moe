/* Vercel stub — browser tasks cannot run in serverless */
export class TaskExecutor {
  constructor(_browserType?: string) {}
  async execute(): Promise<void> { throw new Error('Browser tasks unavailable on Vercel') }
  getActiveScreencast(): null { return null }
  async executeBatch(): Promise<{ executed: number; succeeded: number; failed: number }> {
    return { executed: 0, succeeded: 0, failed: 0 }
  }
}
export function createTaskExecutor(): TaskExecutor { return new TaskExecutor() }
