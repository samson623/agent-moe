/**
 * @jest-environment node
 *
 * Unit tests for GET /api/health
 *
 * Strategy:
 *  - Mock `@supabase/supabase-js` so no real network calls are made.
 *  - Import the handler function directly and call it with a synthetic Request.
 *  - Assert response shape, status codes, and field values.
 *
 * The route uses `createClient` from `@supabase/supabase-js` (not the ssr
 * variant) so the mock is straightforward.
 * Node environment is required because Next.js Route Handlers use the
 * WHATWG Request/Response API which is available in Node 22+ but not jsdom.
 */

import { GET } from '@/app/api/health/route'

// ---------------------------------------------------------------------------
// Mock @supabase/supabase-js
// ---------------------------------------------------------------------------

/** Mutable stub so individual tests can override behaviour */
const mockSelectBehavior: {
  error: { message: string } | null
  shouldReject: Error | null
} = { error: null, shouldReject: null }

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(() => {
        if (mockSelectBehavior.shouldReject) {
          return Promise.reject(mockSelectBehavior.shouldReject)
        }
        return Promise.resolve({ error: mockSelectBehavior.error })
      }),
    })),
  })),
}))

// ---------------------------------------------------------------------------
// Env setup
// ---------------------------------------------------------------------------

const originalEnv = process.env

beforeEach(() => {
  jest.resetModules()
  process.env = {
    ...originalEnv,
    NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
  }
  // Reset to healthy state before each test
  mockSelectBehavior.error = null
  mockSelectBehavior.shouldReject = null
})

afterEach(() => {
  process.env = originalEnv
})

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function callHealthRoute() {
  const response = await GET()
  const json = await response.json()
  return { response, json }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('GET /api/health', () => {
  describe('response shape', () => {
    it('always returns HTTP 200', async () => {
      const { response } = await callHealthRoute()
      expect(response.status).toBe(200)
    })

    it('returns status: "ok" in the body', async () => {
      const { json } = await callHealthRoute()
      expect(json.status).toBe('ok')
    })

    it('includes a timestamp in ISO 8601 format', async () => {
      const { json } = await callHealthRoute()
      expect(typeof json.timestamp).toBe('string')
      expect(() => new Date(json.timestamp)).not.toThrow()
      // Rough ISO check — contains a T separator
      expect(json.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/)
    })

    it('includes version 0.1.0', async () => {
      const { json } = await callHealthRoute()
      expect(json.version).toBe('0.1.0')
    })

    it('includes a database field', async () => {
      const { json } = await callHealthRoute()
      expect(json).toHaveProperty('database')
    })
  })

  describe('when Supabase responds successfully', () => {
    it('sets database: "ok"', async () => {
      mockSelectBehavior.error = null
      const { json } = await callHealthRoute()
      expect(json.database).toBe('ok')
    })

    it('does not include a database_error field', async () => {
      mockSelectBehavior.error = null
      const { json } = await callHealthRoute()
      expect(json.database_error).toBeUndefined()
    })
  })

  describe('when Supabase returns an error', () => {
    beforeEach(() => {
      mockSelectBehavior.error = { message: 'connection refused' }
    })

    it('still returns HTTP 200', async () => {
      const { response } = await callHealthRoute()
      expect(response.status).toBe(200)
    })

    it('sets database: "error"', async () => {
      const { json } = await callHealthRoute()
      expect(json.database).toBe('error')
    })

    it('still sets status: "ok"', async () => {
      const { json } = await callHealthRoute()
      expect(json.status).toBe('ok')
    })

    it('includes the error message in database_error', async () => {
      const { json } = await callHealthRoute()
      expect(json.database_error).toBe('connection refused')
    })
  })

  describe('when env variables are missing', () => {
    it('returns database: "error" when NEXT_PUBLIC_SUPABASE_URL is absent', async () => {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL
      const { json } = await callHealthRoute()
      expect(json.database).toBe('error')
      expect(json.status).toBe('ok')
    })

    it('returns database: "error" when NEXT_PUBLIC_SUPABASE_ANON_KEY is absent', async () => {
      delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      const { json } = await callHealthRoute()
      expect(json.database).toBe('error')
      expect(json.status).toBe('ok')
    })

    it('includes an informative database_error message', async () => {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL
      delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      const { json } = await callHealthRoute()
      expect(typeof json.database_error).toBe('string')
      expect(json.database_error.length).toBeGreaterThan(0)
    })
  })

  describe('when Supabase throws an exception', () => {
    beforeEach(() => {
      mockSelectBehavior.shouldReject = new Error('network timeout')
    })

    it('catches the error and sets database: "error"', async () => {
      const { json } = await callHealthRoute()
      expect(json.database).toBe('error')
      expect(json.database_error).toBe('network timeout')
    })

    it('still returns HTTP 200 when Supabase throws', async () => {
      const { response } = await callHealthRoute()
      expect(response.status).toBe(200)
    })
  })
})
