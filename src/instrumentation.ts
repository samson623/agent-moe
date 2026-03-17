export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { getScheduler } = await import('@/features/browser-agent/scheduler')
    const scheduler = getScheduler()
    await scheduler.start()

    process.on('SIGTERM', () => scheduler.stop())
    process.on('SIGINT', () => scheduler.stop())
  }
}
