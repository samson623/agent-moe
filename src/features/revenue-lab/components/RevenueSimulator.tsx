'use client';

import { useMemo } from 'react';
import { Gem, Cpu, Workflow, UserPlus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { GlassCard, SectionCard, SliderInput, Pill } from '@/components/nebula';
import type { OfferRow } from '@/lib/supabase/types';

interface RevenueSimulatorProps {
  dailyRuns: number;
  onDailyRunsChange: (v: number) => void;
  monthlyLeads: number;
  onMonthlyLeadsChange: (v: number) => void;
  offers: OfferRow[];
}

interface Economics {
  monthlyRuns: number;
  nanoOps: number;
  premiumPlanning: number;
  mediaPackaging: number;
  infra: number;
  totalCost: number;
  totalRevenue: number;
  profit: number;
  breakdown: { label: string; revenue: number }[];
}

function computeEconomics(
  dailyRuns: number,
  monthlyLeads: number,
  offers: OfferRow[],
): Economics {
  const monthlyRuns = dailyRuns * 30;

  // Cost model
  const nanoOps = monthlyRuns * 0.028;
  const premiumPlanning = monthlyRuns * 0.11;
  const mediaPackaging = monthlyRuns * 0.066;
  const infra = 32;
  const totalCost = nanoOps + premiumPlanning + mediaPackaging + infra;

  // Revenue model — use real offer prices if available, else defaults
  const sorted = [...offers]
    .filter((o) => o.status === 'active' && o.price_cents !== null && o.price_cents > 0)
    .sort((a, b) => (a.price_cents ?? 0) - (b.price_cents ?? 0));

  let totalRevenue = 0;
  const breakdown: { label: string; revenue: number }[] = [];

  if (sorted.length === 0) {
    // Fallback defaults when no real offers exist
    const tiers = [
      { name: 'Entry tier', price: 149, rate: 0.11 },
      { name: 'Mid tier', price: 499, rate: 0.05 },
      { name: 'Premium tier', price: 2500, rate: 0.012 },
    ];
    for (const tier of tiers) {
      const rev = monthlyLeads * tier.rate * tier.price;
      totalRevenue += rev;
      breakdown.push({ label: tier.name, revenue: rev });
    }
  } else {
    // Use real offers with descending conversion rates
    const rates = [0.11, 0.05, 0.025, 0.012, 0.008, 0.005];
    for (let i = 0; i < sorted.length && i < rates.length; i++) {
      const offer = sorted[i]!;
      const price = (offer.price_cents ?? 0) / 100;
      const rev = monthlyLeads * rates[i]! * price;
      totalRevenue += rev;
      breakdown.push({ label: offer.name, revenue: rev });
    }
  }

  return {
    monthlyRuns,
    nanoOps,
    premiumPlanning,
    mediaPackaging,
    infra,
    totalCost,
    totalRevenue,
    profit: totalRevenue - totalCost,
    breakdown,
  };
}

function fmt(n: number): string {
  return `$${Math.round(n).toLocaleString()}`;
}

export function RevenueSimulator({
  dailyRuns,
  onDailyRunsChange,
  monthlyLeads,
  onMonthlyLeadsChange,
  offers,
}: RevenueSimulatorProps) {
  const econ = useMemo(
    () => computeEconomics(dailyRuns, monthlyLeads, offers),
    [dailyRuns, monthlyLeads, offers],
  );

  return (
    <SectionCard
      title="Revenue Simulator"
      subtitle="Adjust inputs to model projected economics"
      action={<Pill tone="primary">Live model</Pill>}
    >
      <div className="space-y-5">
        {/* Sliders */}
        <SliderInput
          label="Daily automated runs"
          value={dailyRuns}
          min={4}
          max={40}
          onChange={onDailyRunsChange}
        />
        <SliderInput
          label="Monthly lead volume"
          value={monthlyLeads}
          min={50}
          max={600}
          step={10}
          onChange={onMonthlyLeadsChange}
        />

        {/* Profit highlight */}
        <GlassCard variant="glow" padding="md" hover={false}>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--success-muted)]">
              <Gem size={18} className="text-[var(--success)]" />
            </div>
            <div>
              <p className="text-xs text-[var(--text-muted)]">Projected monthly profit</p>
              <p className="text-2xl font-semibold tracking-tight text-[var(--text)]">
                {fmt(econ.profit)}
              </p>
            </div>
          </div>
        </GlassCard>

        {/* Stats mini-grid */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-3">
            <div className="flex items-center gap-1.5 text-[var(--text-muted)]">
              <Workflow size={12} />
              <span className="text-xs">Runs/mo</span>
            </div>
            <p className="mt-1 text-sm font-semibold tabular-nums text-[var(--text)]">
              {econ.monthlyRuns}
            </p>
          </div>
          <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-3">
            <div className="flex items-center gap-1.5 text-[var(--text-muted)]">
              <Cpu size={12} />
              <span className="text-xs">Cost</span>
            </div>
            <p className="mt-1 text-sm font-semibold tabular-nums text-[var(--text)]">
              {fmt(econ.totalCost)}
            </p>
          </div>
          <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-3">
            <div className="flex items-center gap-1.5 text-[var(--text-muted)]">
              <UserPlus size={12} />
              <span className="text-xs">Revenue</span>
            </div>
            <p className="mt-1 text-sm font-semibold tabular-nums text-[var(--text)]">
              {fmt(econ.totalRevenue)}
            </p>
          </div>
        </div>

        {/* Cost breakdown */}
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
            Cost breakdown
          </p>
          {[
            { label: 'GPT-5 Nano ops', value: econ.nanoOps },
            { label: 'Claude planning', value: econ.premiumPlanning },
            { label: 'Media packaging', value: econ.mediaPackaging },
            { label: 'Infrastructure', value: econ.infra },
          ].map((item) => (
            <div
              key={item.label}
              className="flex items-center justify-between rounded-[var(--radius-sm)] border border-[var(--border-subtle)] bg-[var(--surface)] px-3 py-2 text-sm"
            >
              <span className="text-[var(--text-muted)]">{item.label}</span>
              <span className="font-medium tabular-nums text-[var(--text)]">
                {fmt(item.value)}
              </span>
            </div>
          ))}
        </div>

        {/* Revenue breakdown by offer */}
        {econ.breakdown.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
              Revenue by offer
            </p>
            {econ.breakdown.map((item) => {
              const pct =
                econ.totalRevenue > 0
                  ? Math.round((item.revenue / econ.totalRevenue) * 100)
                  : 0;
              return (
                <div
                  key={item.label}
                  className="rounded-[var(--radius-sm)] border border-[var(--border-subtle)] bg-[var(--surface)] px-3 py-2"
                >
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[var(--text-secondary)] truncate">{item.label}</span>
                    <span className="font-medium tabular-nums text-[var(--text)]">
                      {fmt(item.revenue)}
                    </span>
                  </div>
                  <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-[var(--border)]">
                    <div
                      className="h-full rounded-full bg-[image:var(--gradient-progress)]"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </SectionCard>
  );
}
