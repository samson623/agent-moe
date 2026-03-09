import {
  DollarSign,
  Tag,
  Layers,
  ArrowUpRight,
  Percent,
  Magnet,
  FolderOpen,
  GitFork,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const REVENUE_MODULES = [
  {
    icon: FolderOpen,
    label: "Offer Library",
    description: "Central database of products, services, and programs",
    color: "#f59e0b",
    phase: "Phase 10",
  },
  {
    icon: Tag,
    label: "CTA Strategy",
    description: "Context-aware CTA selection per content type and platform",
    color: "#3b82f6",
    phase: "Phase 10",
  },
  {
    icon: Magnet,
    label: "Lead Magnets",
    description: "High-conversion entry points into your value ladder",
    color: "#10b981",
    phase: "Phase 10",
  },
  {
    icon: Layers,
    label: "Pricing Ladder",
    description: "Free → low-ticket → mid-ticket → high-ticket escalation",
    color: "#7c3aed",
    phase: "Phase 10",
  },
  {
    icon: GitFork,
    label: "Funnel Logic",
    description: "If-then conversion path builder with branching rules",
    color: "#06b6d4",
    phase: "Phase 10",
  },
  {
    icon: Percent,
    label: "Conversion Positioning",
    description: "Revenue Closer maps offers to mission outputs automatically",
    color: "#f43f5e",
    phase: "Phase 10",
  },
];

const MOCK_OFFERS = [
  {
    name: "Free Training",
    type: "Lead Magnet",
    price: "$0",
    cta: "Watch Free",
    status: "Active",
  },
  {
    name: "Starter Course",
    type: "Low Ticket",
    price: "$97",
    cta: "Join Now",
    status: "Draft",
  },
  {
    name: "Coaching Program",
    type: "High Ticket",
    price: "$2,997",
    cta: "Apply",
    status: "Draft",
  },
];

const STATUS_VARIANT: Record<string, "success" | "muted"> = {
  Active: "success",
  Draft: "muted",
};

export function RevenueLabPage() {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex items-center justify-center w-11 h-11 rounded-[var(--radius-lg)]",
              "bg-gradient-to-br from-[#f59e0b] to-[#ef4444]",
              "shadow-[0_0_24px_rgba(245,158,11,0.4)]"
            )}
          >
            <DollarSign size={20} className="text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-[var(--text)]">
              Revenue Lab
            </h2>
            <p className="text-sm text-[var(--text-muted)]">
              Offers, CTA logic, conversion paths, and monetization models
            </p>
          </div>
        </div>
        <Badge variant="warning">Phase 10 — Building Soon</Badge>
      </div>

      {/* Offer Library preview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Offer Library</CardTitle>
            <Badge variant="muted">Preview</Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0 pb-3">
          <div className="divide-y divide-[var(--border-subtle)]">
            {MOCK_OFFERS.map((offer) => (
              <div
                key={offer.name}
                className={cn(
                  "flex items-center gap-4 px-5 py-3.5",
                  "hover:bg-[var(--surface-hover)] transition-colors duration-100"
                )}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[var(--text)]">
                    {offer.name}
                  </p>
                  <p className="text-xs text-[var(--text-muted)]">
                    {offer.type}
                  </p>
                </div>
                <span className="text-sm font-bold text-[var(--text)] tabular-nums">
                  {offer.price}
                </span>
                <Badge variant="outline" className="text-[10px]">
                  {offer.cta}
                </Badge>
                <Badge variant={STATUS_VARIANT[offer.status] ?? "muted"}>
                  {offer.status}
                </Badge>
                <button
                  type="button"
                  className="text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors"
                  aria-label={`View ${offer.name}`}
                >
                  <ArrowUpRight size={14} />
                </button>
              </div>
            ))}
          </div>
          <div className="px-5 pt-2">
            <p className="text-xs text-[var(--text-muted)]">
              Full offer management unlocks in Phase 10
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Revenue modules grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {REVENUE_MODULES.map((mod) => {
          const Icon = mod.icon;
          return (
            <div
              key={mod.label}
              className={cn(
                "p-4 rounded-[var(--radius-lg)] border border-[var(--border)]",
                "bg-[var(--surface)] hover:bg-[var(--surface-hover)]",
                "transition-all duration-150"
              )}
            >
              <div className="flex items-start gap-3">
                <div
                  className="flex items-center justify-center w-9 h-9 rounded-[var(--radius)] shrink-0"
                  style={{
                    background: `${mod.color}18`,
                    border: `1px solid ${mod.color}30`,
                  }}
                >
                  <Icon size={16} style={{ color: mod.color }} />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-semibold text-[var(--text)]">
                      {mod.label}
                    </p>
                    <Badge variant="muted" className="text-[9px]">
                      {mod.phase}
                    </Badge>
                  </div>
                  <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                    {mod.description}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty state */}
      <div
        className={cn(
          "relative rounded-[var(--radius-xl)] border border-[var(--border)]",
          "bg-[var(--surface)] p-12 text-center overflow-hidden"
        )}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at 50% 0%, rgba(245,158,11,0.06) 0%, transparent 70%)",
          }}
          aria-hidden="true"
        />
        <div className="relative flex flex-col items-center gap-4">
          <div
            className={cn(
              "flex items-center justify-center w-14 h-14 rounded-[var(--radius-xl)]",
              "border border-[rgba(245,158,11,0.3)]"
            )}
            style={{ background: "rgba(245,158,11,0.12)" }}
          >
            <DollarSign size={24} className="text-[var(--warning)]" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-[var(--text)] mb-1.5">
              Revenue Lab
            </h3>
            <p className="text-sm text-[var(--text-muted)] max-w-md mx-auto leading-relaxed">
              The Revenue Closer will auto-match your offers to every piece of
              content, select the right CTA, build conversion paths, and
              position your value ladder for maximum yield.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap justify-center">
            <Badge variant="warning">Phase 10 — Revenue Closer</Badge>
            <Badge variant="muted">Offer Mapping</Badge>
            <Badge variant="muted">Funnel Builder</Badge>
          </div>
        </div>
      </div>
    </div>
  );
}
