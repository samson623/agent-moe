/**
 * @jest-environment node
 */

import { POST } from '@/app/api/jobs/[id]/execute/route'
import { createAdminClient } from '@/lib/supabase/server'
import { getJob } from '@/lib/supabase/queries/jobs'
import { updateMissionStatus } from '@/lib/supabase/queries/missions'
import { createExecutionEngine } from '@/features/mission-engine/services/execution-engine'

jest.mock('@/lib/supabase/server', () => ({
  createAdminClient: jest.fn(),
}))

jest.mock('@/lib/supabase/queries/jobs', () => ({
  getJob: jest.fn(),
}))

jest.mock('@/lib/supabase/queries/missions', () => ({
  updateMissionStatus: jest.fn(),
}))

jest.mock('@/features/mission-engine/services/execution-engine', () => ({
  createExecutionEngine: jest.fn(),
}))

describe('POST /api/jobs/[id]/execute', () => {
  const client = {} as ReturnType<typeof createAdminClient>

  beforeEach(() => {
    jest.clearAllMocks()
    ;(createAdminClient as jest.Mock).mockReturnValue(client)
    ;(updateMissionStatus as jest.Mock).mockResolvedValue({ data: null, error: null })
  })

  it('executes mission until completion and updates mission status lifecycle', async () => {
    ;(getJob as jest.Mock).mockResolvedValue({
      data: { id: 'job-1', mission_id: 'mission-1' },
      error: null,
    })

    const execute = jest.fn().mockResolvedValue({
      missionId: 'mission-1',
      jobsExecuted: 5,
      jobsCompleted: 5,
      jobsFailed: 0,
      totalDurationMs: 1234,
      finalStatus: 'completed',
    })

    ;(createExecutionEngine as jest.Mock).mockReturnValue({ execute })

    const request = new Request('http://localhost/api/jobs/job-1/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workspace_id: '11111111-1111-1111-1111-111111111111' }),
    })

    const response = await POST(request as never, {
      params: Promise.resolve({ id: 'job-1' }),
    })

    expect(response.status).toBe(200)
    expect(execute).toHaveBeenCalledWith()

    expect(updateMissionStatus).toHaveBeenNthCalledWith(
      1,
      client,
      'mission-1',
      'running',
    )
    expect(updateMissionStatus).toHaveBeenNthCalledWith(
      2,
      client,
      'mission-1',
      'completed',
    )

    const body = await response.json()
    expect(body.summary.finalStatus).toBe('completed')
    expect(body.summary.jobsExecuted).toBe(5)
  })

  it('maps blocked execution to paused mission status', async () => {
    ;(getJob as jest.Mock).mockResolvedValue({
      data: { id: 'job-2', mission_id: 'mission-2' },
      error: null,
    })

    ;(createExecutionEngine as jest.Mock).mockReturnValue({
      execute: jest.fn().mockResolvedValue({
        missionId: 'mission-2',
        jobsExecuted: 2,
        jobsCompleted: 1,
        jobsFailed: 1,
        totalDurationMs: 999,
        finalStatus: 'blocked',
      }),
    })

    const request = new Request('http://localhost/api/jobs/job-2/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workspace_id: '22222222-2222-2222-2222-222222222222' }),
    })

    const response = await POST(request as never, {
      params: Promise.resolve({ id: 'job-2' }),
    })

    expect(response.status).toBe(200)
    expect(updateMissionStatus).toHaveBeenLastCalledWith(
      client,
      'mission-2',
      'paused',
    )
  })
})
