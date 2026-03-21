/**
 * Install Scheduler — Register Mission Runner with Windows Task Scheduler
 *
 * Creates a Windows Scheduled Task that runs `npx tsx scripts/mission-runner.ts`
 * every 1 minute. Uses schtasks.exe — no external dependencies.
 *
 * Generates a .bat wrapper because schtasks /TR doesn't handle nested quotes
 * or complex commands reliably.
 *
 * Run:      npx tsx scripts/install-scheduler.ts
 * Remove:   npx tsx scripts/install-scheduler.ts --uninstall
 */

import { execSync } from 'child_process'
import { writeFileSync, unlinkSync, existsSync } from 'fs'
import { resolve } from 'path'

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const TASK_NAME = 'AgentMOE_MissionRunner'
const PROJECT_DIR = resolve(process.cwd())
const RUNNER_SCRIPT = 'scripts\\mission-runner.ts'
const BAT_FILE = resolve(PROJECT_DIR, 'scripts', 'run-mission-runner.bat')
const INTERVAL_MINUTES = 1

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function log(msg: string) {
  console.log(`[install-scheduler] ${msg}`)
}

function runCmd(cmd: string, silent = false): string {
  try {
    return execSync(cmd, { encoding: 'utf-8', stdio: silent ? 'pipe' : 'inherit' })
  } catch (err) {
    if (!silent) {
      console.error(`Command failed: ${cmd}`)
      console.error(err instanceof Error ? err.message : err)
    }
    throw err
  }
}

function taskExists(): boolean {
  try {
    runCmd(`schtasks /Query /TN "${TASK_NAME}" /FO LIST`, true)
    return true
  } catch {
    return false
  }
}

// ---------------------------------------------------------------------------
// Install
// ---------------------------------------------------------------------------

function install() {
  log(`Installing scheduled task: ${TASK_NAME}`)
  log(`Project directory: ${PROJECT_DIR}`)
  log(`Runner script: ${RUNNER_SCRIPT}`)
  log(`Interval: every ${INTERVAL_MINUTES} minute(s)`)

  // Delete existing task if present
  if (taskExists()) {
    log(`Task "${TASK_NAME}" already exists — deleting and recreating`)
    runCmd(`schtasks /Delete /TN "${TASK_NAME}" /F`, true)
  }

  // Write a .bat wrapper — schtasks handles simple .bat paths cleanly
  const batContent = [
    '@echo off',
    `cd /d "${PROJECT_DIR}"`,
    `npx tsx ${RUNNER_SCRIPT}`,
  ].join('\r\n')

  writeFileSync(BAT_FILE, batContent, 'utf-8')
  log(`Created batch wrapper: ${BAT_FILE}`)

  // Create the scheduled task
  const schtasksCmd = [
    'schtasks /Create',
    `/TN "${TASK_NAME}"`,
    '/SC MINUTE',
    `/MO ${INTERVAL_MINUTES}`,
    `/TR "${BAT_FILE}"`,
    '/RL HIGHEST',
    '/F',
  ].join(' ')

  try {
    runCmd(schtasksCmd)
    log('Scheduled task created successfully!')
    log('')
    log('Verify with:')
    log(`  schtasks /Query /TN "${TASK_NAME}" /FO LIST /V`)
    log('')
    log('Test manually:')
    log(`  npx tsx scripts/mission-runner.ts`)
    log('')
    log('To uninstall:')
    log('  npx tsx scripts/install-scheduler.ts --uninstall')
  } catch {
    log('Failed to create scheduled task.')
    log('Make sure you are running this from an elevated (admin) terminal.')
    process.exit(1)
  }
}

// ---------------------------------------------------------------------------
// Uninstall
// ---------------------------------------------------------------------------

function uninstall() {
  log(`Removing scheduled task: ${TASK_NAME}`)

  if (!taskExists()) {
    log('Task does not exist — nothing to remove.')
  } else {
    try {
      runCmd(`schtasks /Delete /TN "${TASK_NAME}" /F`)
      log('Scheduled task removed successfully.')
    } catch {
      log('Failed to remove scheduled task.')
      log('Make sure you are running this from an elevated (admin) terminal.')
      process.exit(1)
    }
  }

  // Clean up the .bat wrapper
  if (existsSync(BAT_FILE)) {
    unlinkSync(BAT_FILE)
    log('Removed batch wrapper.')
  }
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

const args = process.argv.slice(2)

if (args.includes('--uninstall') || args.includes('--remove')) {
  uninstall()
} else {
  install()
}
