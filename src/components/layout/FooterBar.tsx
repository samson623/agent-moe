import { Bell, Building2, Globe, Rocket, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const LEFT_BADGES = [
  { label: "Approval-aware execution", icon: Bell },
  { label: "Monetization-oriented routing", icon: Rocket },
  { label: "Multi-channel, multi-offer model", icon: Globe },
];

const RIGHT_BADGES = [
  { label: "Built like a premium product", icon: Building2 },
  { label: "Ready to evolve into a real repo", icon: Rocket },
];

function CapBadge({
  children,
  icon: Icon,
}: {
  children: React.ReactNode;
  icon: LucideIcon;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm",
        "border-[var(--border-subtle)] bg-[rgba(255,255,255,0.035)] text-[var(--text-muted)]"
      )}
    >
      <Icon size={14} />
      {children}
    </span>
  );
}

export function FooterBar() {
  return (
    <footer className="border-t border-[var(--border-subtle)] px-6 py-4 md:px-8">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {LEFT_BADGES.map((badge) => (
            <CapBadge key={badge.label} icon={badge.icon}>
              {badge.label}
            </CapBadge>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {RIGHT_BADGES.map((badge) => (
            <CapBadge key={badge.label} icon={badge.icon}>
              {badge.label}
            </CapBadge>
          ))}
        </div>
      </div>
    </footer>
  );
}
