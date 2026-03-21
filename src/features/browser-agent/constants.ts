/**
 * Shared UI constants for browser agent task types and statuses.
 *
 * Single source of truth — imported by BrowserTaskCard, BrowserTaskDetailPage,
 * BrowserTaskFilters, CreateBrowserTaskModal, and ScheduleCard.
 */

import {
  Globe,
  Camera,
  MousePointer,
  FileText,
  Search,
  Monitor,
  Send,
  Navigation,
  Bot,
} from 'lucide-react'
import type { BrowserTaskType, BrowserTaskStatus } from './types'

// ── Task Type Config ──

export interface TaskTypeConfig {
  label: string
  description: string
  Icon: React.ElementType
  color: string
}

export const TASK_TYPE_CONFIG: Record<BrowserTaskType, TaskTypeConfig> = {
  scrape:       { label: 'Scrape',       description: 'Extract full page text, links, and HTML',      Icon: Globe,        color: '#6366f1' },
  screenshot:   { label: 'Screenshot',   description: 'Capture a full-page screenshot',               Icon: Camera,       color: '#8b5cf6' },
  click:        { label: 'Click',        description: 'Click an element and capture result',          Icon: MousePointer, color: '#f59e0b' },
  fill_form:    { label: 'Fill Form',    description: 'Fill form fields with data',                   Icon: FileText,     color: '#3b82f6' },
  navigate:     { label: 'Navigate',     description: 'Load a URL and capture page metadata',         Icon: Navigation,   color: '#10b981' },
  monitor:      { label: 'Monitor',      description: 'Check a page for changes or metrics',          Icon: Monitor,      color: '#ec4899' },
  extract_data: { label: 'Extract Data', description: 'Pull specific fields using selectors',         Icon: Search,       color: '#14b8a6' },
  submit_form:  { label: 'Submit Form',  description: 'Fill and submit a form',                       Icon: Send,         color: '#f97316' },
  autonomous:   { label: 'Autonomous',   description: 'AI drives the browser with natural language',  Icon: Bot,          color: '#a855f7' },
}

// ── Status Config ──

export interface StatusConfig {
  label: string
  color: string
  pulse?: boolean
}

export const STATUS_CONFIG: Record<BrowserTaskStatus, StatusConfig> = {
  pending:   { label: 'Pending',   color: '#f59e0b' },
  running:   { label: 'Running',   color: '#3b82f6', pulse: true },
  completed: { label: 'Completed', color: '#10b981' },
  failed:    { label: 'Failed',    color: '#ef4444' },
  cancelled: { label: 'Cancelled', color: '#6b7280' },
  timeout:   { label: 'Timeout',   color: '#f97316' },
}

// ── Derived lists for filters ──

export const TASK_TYPE_OPTIONS: Array<{ value: BrowserTaskType | 'all'; label: string }> = [
  { value: 'all', label: 'All Types' },
  ...Object.entries(TASK_TYPE_CONFIG).map(([value, cfg]) => ({
    value: value as BrowserTaskType,
    label: cfg.label,
  })),
]

export const STATUS_OPTIONS: Array<{ value: BrowserTaskStatus | 'all'; label: string }> = [
  { value: 'all', label: 'All' },
  ...Object.entries(STATUS_CONFIG).map(([value, cfg]) => ({
    value: value as BrowserTaskStatus,
    label: cfg.label,
  })),
]
