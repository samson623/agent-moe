/* Vercel stub — step emitter is a no-op in serverless */
export type StepCallback = (step: unknown) => void
export function subscribeToSteps(_taskId: string, _callback: StepCallback): () => void {
  return () => {}
}
export function emitStep(): void {}
export function cleanupStepEmitter(): void {}
