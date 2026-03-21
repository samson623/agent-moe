/**
 * Knowledge Context — helpers for injecting marketing knowledge into operator prompts.
 *
 * Reads the four knowledge files from this directory and exposes two functions:
 *   - getKnowledgeContext(operatorTeam)  → relevant sections for a specific operator
 *   - getPlaybookContext()               → playbook triggers + sequences for the mission planner
 *
 * File reads are cached after the first call (module-level cache).
 */

import fs from "fs";
import path from "path";
import { OperatorTeam } from "@/features/ai/types";

// ---------------------------------------------------------------------------
// Cache
// ---------------------------------------------------------------------------

const cache: Record<string, string> = {};

const KNOWLEDGE_DIR = path.join(process.cwd(), "src/features/ai/knowledge");

function readFile(filename: string): string {
  if (cache[filename]) return cache[filename];
  const content = fs.readFileSync(path.join(KNOWLEDGE_DIR, filename), "utf-8");
  cache[filename] = content;
  return content;
}

// ---------------------------------------------------------------------------
// Section extractor
// Extract a top-level numbered section by heading number, e.g. "2." or "4."
// ---------------------------------------------------------------------------

// Matches top-level headings of the form "# N." (single `#` = top-level section boundary).
const TOP_LEVEL_HEADING_RE = /^# \d+\./m;

function extractSection(markdown: string, sectionNumber: string): string {
  // Find the start of the target section (top-level headings only: "# N.")
  const startPattern = new RegExp(`^# ${sectionNumber}\\.`, "m");
  const startMatch = startPattern.exec(markdown);
  if (!startMatch) return "";

  const startIdx = startMatch.index;

  // Find the next top-level heading after startIdx to determine the section boundary
  const rest = markdown.slice(startIdx + 1);
  const nextMatch = TOP_LEVEL_HEADING_RE.exec(rest);
  const endIdx = nextMatch ? startIdx + 1 + nextMatch.index : markdown.length;

  return markdown.slice(startIdx, endIdx).trim();
}

function extractSections(markdown: string, sectionNumbers: string[]): string {
  return sectionNumbers
    .map((n) => extractSection(markdown, n))
    .filter(Boolean)
    .join("\n\n");
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Returns a trimmed knowledge context string for the given operator team.
 * Extracts only the sections relevant to that operator's role.
 */
export function getKnowledgeContext(operatorTeam: OperatorTeam | string): string {
  const doctrine = readFile("marketing-doctrine.md");
  const benchmarks = readFile("marketing-benchmarks.md");

  switch (operatorTeam) {
    case OperatorTeam.CONTENT_STRIKE:
    case "content_strike": {
      const doctrineSection = extractSections(doctrine, ["4"]);
      const benchmarkSection = extractSections(benchmarks, ["4"]);
      return [doctrineSection, benchmarkSection].filter(Boolean).join("\n\n").trim();
    }

    case OperatorTeam.GROWTH_OPERATOR:
    case "growth_operator": {
      const doctrineSection = extractSections(doctrine, ["2", "7"]);
      const benchmarkSection = extractSections(benchmarks, ["2", "7"]);
      return [doctrineSection, benchmarkSection].filter(Boolean).join("\n\n").trim();
    }

    case OperatorTeam.REVENUE_CLOSER:
    case "revenue_closer": {
      const doctrineSection = extractSections(doctrine, ["5"]);
      const benchmarkSection = extractSections(benchmarks, ["5"]);
      return [doctrineSection, benchmarkSection].filter(Boolean).join("\n\n").trim();
    }

    case OperatorTeam.BRAND_GUARDIAN:
    case "brand_guardian": {
      const doctrineSection = extractSections(doctrine, ["1", "3"]);
      const agentRules = readFile("marketing-agent-rules.md");
      return [doctrineSection, agentRules].filter(Boolean).join("\n\n").trim();
    }

    default:
      return "";
  }
}

/**
 * Returns a summary of playbook triggers and agent sequences for the mission planner.
 * Reads marketing-playbooks.md and returns its full content (it is already concise).
 */
export function getPlaybookContext(): string {
  return readFile("marketing-playbooks.md").trim();
}
