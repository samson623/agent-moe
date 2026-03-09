import {
  Link as LinkIcon,
  CheckCircle2,
  XCircle,
  Plus,
  Globe,
  Mail,
  Database,
  Smartphone,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ConnectorDef {
  name: string;
  type: string;
  description: string;
  icon: string;
  status: "connected" | "disconnected" | "coming";
  color: string;
  phase: string;
}

const CONNECTORS: ConnectorDef[] = [
  {
    name: "X / Twitter",
    type: "Social",
    description: "Post threads, schedule tweets, track engagement",
    icon: "X",
    status: "coming",
    color: "#e2e8f0",
    phase: "Phase 9",
  },
  {
    name: "LinkedIn",
    type: "Social",
    description: "Publish posts, articles, and carousels",
    icon: "in",
    status: "coming",
    color: "#0077b5",
    phase: "Phase 9",
  },
  {
    name: "Instagram",
    type: "Social",
    description: "Reels, carousels, stories, and captions",
    icon: "IG",
    status: "coming",
    color: "#e1306c",
    phase: "Phase 9",
  },
  {
    name: "YouTube",
    type: "Video",
    description: "Upload videos, thumbnails, titles, descriptions",
    icon: "YT",
    status: "coming",
    color: "#ff0000",
    phase: "Phase 9",
  },
  {
    name: "TikTok",
    type: "Video",
    description: "Short-form video publishing and caption delivery",
    icon: "TK",
    status: "coming",
    color: "#010101",
    phase: "Phase 9",
  },
  {
    name: "Email / Beehiiv",
    type: "Email",
    description: "Newsletter drafts, sequences, and send triggers",
    icon: "EM",
    status: "coming",
    color: "#f59e0b",
    phase: "Phase 9",
  },
  {
    name: "Supabase",
    type: "Database",
    description: "Primary data store — connected and running",
    icon: "SB",
    status: "connected",
    color: "#3ecf8e",
    phase: "Phase 0",
  },
  {
    name: "Playwright MCP",
    type: "Browser",
    description: "Browser automation for research and scraping",
    icon: "PW",
    status: "coming",
    color: "#45ba4b",
    phase: "Phase 8",
  },
];

const CONNECTOR_CATEGORIES = [
  { icon: Globe, label: "Social Platforms", count: 5 },
  { icon: Mail, label: "Email Providers", count: 2 },
  { icon: Database, label: "Databases", count: 1 },
  { icon: Smartphone, label: "Browser Agents", count: 1 },
];

const STATUS_CONFIG = {
  connected: {
    icon: CheckCircle2,
    color: "var(--success)",
    label: "Connected",
    variant: "success" as const,
  },
  disconnected: {
    icon: XCircle,
    color: "var(--danger)",
    label: "Disconnected",
    variant: "danger" as const,
  },
  coming: {
    icon: Zap,
    color: "var(--text-muted)",
    label: "Coming Soon",
    variant: "muted" as const,
  },
};

function ConnectorCard({ connector }: { connector: ConnectorDef }) {
  const statusCfg = STATUS_CONFIG[connector.status];
  const StatusIcon = statusCfg.icon;

  return (
    <div
      className={cn(
        "relative flex items-start gap-3 p-4 rounded-[var(--radius-lg)]",
        "border border-[var(--border)] bg-[var(--surface)]",
        "hover:bg-[var(--surface-hover)] transition-all duration-150",
        connector.status === "connected" &&
          "border-[rgba(62,207,142,0.2)] bg-[rgba(62,207,142,0.03)]"
      )}
    >
      {/* Icon badge */}
      <div
        className="flex items-center justify-center w-10 h-10 rounded-[var(--radius)] shrink-0 text-xs font-bold"
        style={{
          background: `${connector.color}15`,
          border: `1px solid ${connector.color}30`,
          color: connector.color,
        }}
      >
        {connector.icon}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-0.5">
          <p className="text-sm font-semibold text-[var(--text)] truncate">
            {connector.name}
          </p>
          <div className="flex items-center gap-1 shrink-0">
            <StatusIcon
              size={12}
              style={{ color: statusCfg.color }}
            />
            <span className="text-[10px] font-medium" style={{ color: statusCfg.color }}>
              {statusCfg.label}
            </span>
          </div>
        </div>
        <p className="text-xs text-[var(--text-muted)] leading-relaxed">
          {connector.description}
        </p>
        <div className="flex items-center gap-2 mt-2">
          <Badge variant="muted" className="text-[9px]">
            {connector.type}
          </Badge>
          <Badge variant="muted" className="text-[9px]">
            {connector.phase}
          </Badge>
        </div>
      </div>
    </div>
  );
}

export function ConnectorsPage() {
  const connected = CONNECTORS.filter((c) => c.status === "connected").length;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex items-center justify-center w-11 h-11 rounded-[var(--radius-lg)]",
              "bg-gradient-to-br from-[#06b6d4] to-[#7c3aed]",
              "shadow-[0_0_24px_rgba(6,182,212,0.4)]"
            )}
          >
            <LinkIcon size={20} className="text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-[var(--text)]">Connectors</h2>
            <p className="text-sm text-[var(--text-muted)]">
              Linked platforms and external services
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="success">{connected} Connected</Badge>
          <Badge variant="warning">Phase 9 — Building Soon</Badge>
        </div>
      </div>

      {/* Category overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {CONNECTOR_CATEGORIES.map(({ icon: Icon, label, count }) => (
          <div
            key={label}
            className={cn(
              "flex items-center gap-3 p-4 rounded-[var(--radius-lg)]",
              "border border-[var(--border)] bg-[var(--surface)]"
            )}
          >
            <Icon size={16} className="text-[var(--primary)] shrink-0" />
            <div>
              <p className="text-sm font-semibold text-[var(--text)]">
                {count}
              </p>
              <p className="text-xs text-[var(--text-muted)]">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Add connector CTA */}
      <Card glow="primary">
        <CardContent className="py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "flex items-center justify-center w-8 h-8 rounded-[var(--radius)]",
                  "bg-[var(--primary-muted)] border border-[rgba(59,130,246,0.2)]"
                )}
              >
                <Plus size={15} className="text-[var(--primary)]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--text)]">
                  OAuth Integration System
                </p>
                <p className="text-xs text-[var(--text-muted)]">
                  Secure OAuth 2.0 for all platforms — connect once, publish everywhere
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" className="shrink-0" disabled>
              Phase 9
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Connector grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-[var(--text)]">
            All Connectors
          </h3>
          <span className="text-xs text-[var(--text-muted)]">
            {CONNECTORS.length} total
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {CONNECTORS.map((connector) => (
            <ConnectorCard key={connector.name} connector={connector} />
          ))}
        </div>
      </div>

      {/* Platform table */}
      <Card>
        <CardHeader>
          <CardTitle>Integration Queue</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-sm text-[var(--text-muted)] leading-relaxed">
            Connectors ship in{" "}
            <span className="text-[var(--primary)] font-medium">Phase 9</span>{" "}
            via OAuth 2.0. Once connected, the Launchpad can trigger approved
            content to publish automatically. Supabase is already connected as
            the primary database — all other integrations are queued.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
