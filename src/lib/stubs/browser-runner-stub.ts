/**
 * Stub for BrowserRunner on Vercel / serverless environments.
 * Playwright cannot run in serverless — this stub is aliased in by
 * next.config.ts so the playwright import chain is never traced by NFT.
 */
const unavailable = () => { throw new Error('Browser agent not available in serverless') };

export class BrowserRunner {
  constructor(_browserType?: string) {}
  async launch() { unavailable() }
  async close() {}
  async executeTask(): Promise<never> { return unavailable() as never }
  async streamTask(): Promise<never> { return unavailable() as never }
  async getPage(): Promise<never> { return unavailable() as never }
}
