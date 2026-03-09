import type { LucideIcon } from "lucide-react";
import {
  FileText,
  Video,
  Image,
  MessageSquare,
  Filter,
  Search,
  SlidersHorizontal,
  Layers,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ContentTypeCardProps {
  icon: LucideIcon;
  label: string;
  count: string;
  color: string;
}

function ContentTypeCard({ icon: Icon, label, count, color }: ContentTypeCardProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 p-4 rounded-[var(--radius-lg)]",
        "border border-[var(--border)] bg-[var(--surface-elevated)]",
        "hover:border-[var(--primary)] hover:bg-[var(--surface-hover)]",
        "transition-all duration-150 cursor-pointer group"
      )}
    >
      <div
        className="flex items-center justify-center w-10 h-10 rounded-[var(--radius)]"
        style={{ background: `${color}20`, border: `1px solid ${color}30` }}
      >
        <Icon size={18} style={{ color }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[var(--text)]">{label}</p>
        <p className="text-xs text-[var(--text-muted)]">{count} assets</p>
      </div>
    </div>
  );
}

const CONTENT_TYPES: ContentTypeCardProps[] = [
  {
    icon: FileText,
    label: "Posts & Threads",
    count: "0",
    color: "var(--primary)",
  },
  {
    icon: MessageSquare,
    label: "Captions & Hooks",
    count: "0",
    color: "var(--accent)",
  },
  { icon: Video, label: "Video Scripts", count: "0", color: "var(--warning)" },
  {
    icon: Image,
    label: "Thumbnails & Carousels",
    count: "0",
    color: "var(--success)",
  },
  {
    icon: Sparkles,
    label: "CTA Packs",
    count: "0",
    color: "var(--info)",
  },
  {
    icon: Layers,
    label: "All Assets",
    count: "0",
    color: "var(--text-secondary)",
  },
];

const PLATFORMS = ["All", "X / Twitter", "LinkedIn", "Instagram", "TikTok", "YouTube"];

export function ContentStudioPage() {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex items-center justify-center w-11 h-11 rounded-[var(--radius-lg)]",
              "bg-gradient-to-br from-[#7c3aed] to-[#3b82f6]",
              "shadow-[0_0_24px_rgba(124,58,237,0.4)]"
            )}
          >
            <FileText size={20} className="text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-[var(--text)]">
              Content Studio
            </h2>
            <p className="text-sm text-[var(--text-muted)]">
              All generated assets — posts, scripts, CTAs, thumbnails
            </p>
          </div>
        </div>
        <Badge variant="accent">Phase 4 — Building Soon</Badge>
      </div>

      {/* Content type filter row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {CONTENT_TYPES.map((ct) => (
          <ContentTypeCard key={ct.label} {...ct} />
        ))}
      </div>

      {/* Filter bar */}
      <Card>
        <CardContent className="py-3 px-4">
          <div className="flex items-center gap-3 flex-wrap">
            <div
              className={cn(
                "flex items-center gap-2 flex-1 min-w-[180px] px-3 h-8",
                "rounded-[var(--radius)] border border-[var(--border)]",
                "bg-[var(--surface-elevated)]"
              )}
            >
              <Search size={13} className="text-[var(--text-muted)] shrink-0" />
              <span className="text-sm text-[var(--text-disabled)]">
                Search assets...
              </span>
            </div>

            <div className="flex items-center gap-2">
              {PLATFORMS.slice(0, 4).map((p) => (
                <button
                  key={p}
                  className={cn(
                    "px-3 h-7 rounded-full text-xs font-medium transition-colors duration-100",
                    p === "All"
                      ? "bg-[var(--primary)] text-white"
                      : "bg-[var(--surface-elevated)] text-[var(--text-muted)] border border-[var(--border)] hover:border-[var(--primary)] hover:text-[var(--text)]"
                  )}
                >
                  {p}
                </button>
              ))}
            </div>

            <Button variant="outline" size="sm" className="gap-1.5 ml-auto shrink-0">
              <Filter size={13} />
              Filters
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5 shrink-0">
              <SlidersHorizontal size={13} />
              Sort
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Empty state / coming soon */}
      <div
        className={cn(
          "relative rounded-[var(--radius-xl)] border-2 border-dashed border-[var(--border)]",
          "bg-[var(--surface)] p-16 text-center",
          "overflow-hidden"
        )}
      >
        {/* Background grid */}
        <div className="absolute inset-0 grid-bg opacity-50" aria-hidden="true" />

        {/* Glow orb */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full blur-3xl opacity-10 pointer-events-none"
          style={{
            background:
              "radial-gradient(circle, var(--accent) 0%, var(--primary) 100%)",
          }}
          aria-hidden="true"
        />

        <div className="relative flex flex-col items-center gap-4">
          <div
            className={cn(
              "flex items-center justify-center w-16 h-16 rounded-[var(--radius-xl)]",
              "bg-gradient-to-br from-[var(--accent-muted)] to-[var(--primary-muted)]",
              "border border-[rgba(124,58,237,0.3)]"
            )}
          >
            <FileText size={28} className="text-[var(--accent)]" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-[var(--text)] mb-2">
              Content Studio
            </h3>
            <p className="text-sm text-[var(--text-muted)] max-w-sm mx-auto leading-relaxed">
              Full asset management with inline editing, version history, status
              workflow, and platform targeting — across all content types.
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap justify-center">
            <Badge variant="accent">Phase 4 — Building Soon</Badge>
            <Badge variant="muted">Asset Library</Badge>
            <Badge variant="muted">Version History</Badge>
            <Badge variant="muted">Platform Targeting</Badge>
          </div>
        </div>
      </div>
    </div>
  );
}
