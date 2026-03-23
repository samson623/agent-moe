/* Vercel stub — executor registry is a no-op in serverless */
export function registerExecutor(): void {}
export function unregisterExecutor(): void {}
export function getExecutor(): null { return null }
export function hasExecutor(): boolean { return false }
export function getActiveCount(): number { return 0 }
