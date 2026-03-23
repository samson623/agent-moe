/**
 * Stub for the browser-agent scheduler on Vercel / serverless environments.
 * Playwright cannot run in serverless — this stub replaces the real scheduler
 * so the webpack alias prevents NFT from tracing playwright into every Lambda.
 */
export function getScheduler() {
  return {
    start: async () => {},
    stop: async () => {},
  };
}
