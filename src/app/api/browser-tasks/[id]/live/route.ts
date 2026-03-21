import { NextRequest } from 'next/server'
import { getExecutor } from '@/features/browser-agent/executor-registry'
import type { Screencast } from '@/features/browser-agent/screencast'
import { subscribeToSteps } from '@/features/browser-agent/step-emitter'

export const dynamic = 'force-dynamic'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: taskId } = await params

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    start(controller) {
      // Helper to send an SSE event
      function send(event: string, data: Record<string, unknown>) {
        const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
        try {
          controller.enqueue(encoder.encode(message))
        } catch {
          // Stream may be closed
        }
      }

      // Look up the executor for this task
      const executor = getExecutor(taskId)

      if (!executor) {
        send('error', { message: 'No active executor for this task. Task may not be running or live view may not be enabled.' })
        controller.close()
        return
      }

      // Get the screencast from the executor
      const screencast = executor.getActiveScreencast()

      if (!screencast || !screencast.isActive()) {
        // Screencast may not be ready yet — poll briefly
        let attempts = 0
        const maxAttempts = 20 // 2 seconds of polling
        const pollInterval = setInterval(() => {
          attempts++
          const sc = executor.getActiveScreencast()

          if (sc && sc.isActive()) {
            clearInterval(pollInterval)
            attachToScreencast(sc)
            return
          }

          if (attempts >= maxAttempts) {
            clearInterval(pollInterval)
            send('error', { message: 'Screencast not available. Ensure the task has enable_live_view: true in its config.' })
            controller.close()
          }
        }, 100)

        return
      }

      attachToScreencast(screencast)

      function attachToScreencast(sc: Screencast) {
        send('status', {
          status: 'connected',
          taskId,
          format: sc.getOptions().format,
          maxWidth: sc.getOptions().maxWidth,
          maxHeight: sc.getOptions().maxHeight,
        })

        // Subscribe to frames
        const unsubscribe = sc.subscribe((frame) => {
          send('frame', {
            base64: frame.base64,
            frameNumber: frame.frameNumber,
            timestamp: frame.metadata.timestamp,
            width: frame.metadata.deviceWidth,
            height: frame.metadata.deviceHeight,
          })
        })

        // Subscribe to autonomous step events
        const unsubscribeSteps = subscribeToSteps(taskId, (step) => {
          send('step', {
            step: step.step,
            action: step.action,
            reasoning: step.reasoning,
            params: step.params,
            duration_ms: step.duration_ms,
          })
        })

        // Check periodically if screencast has stopped
        const healthCheck = setInterval(() => {
          if (!sc.isActive()) {
            clearInterval(healthCheck)
            unsubscribe()
            unsubscribeSteps()
            send('status', {
              status: 'ended',
              totalFrames: sc.getFrameCount(),
            })
            controller.close()
          }
        }, 500)

        // Clean up if the client disconnects
        // Note: _request.signal.addEventListener would be ideal but we use
        // the controller's cancel mechanism via the ReadableStream cancel callback
      }
    },

    cancel() {
      // Client disconnected — cleanup happens via GC of closures
      console.log(`[Live SSE] Client disconnected from task ${taskId}`)
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}
