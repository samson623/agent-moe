'use client';

import { cn } from '@/lib/utils';

interface SliderInputProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  formatValue?: (value: number) => string;
  className?: string;
}

export function SliderInput({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  formatValue,
  className,
}: SliderInputProps) {
  const display = formatValue ? formatValue(value) : String(value);
  const pct = ((value - min) / (max - min)) * 100;

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between text-sm">
        <span className="text-[var(--text-secondary)]">{label}</span>
        <span className="font-semibold tabular-nums text-[var(--text)]">{display}</span>
      </div>
      <div className="relative">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="nebula-slider w-full"
        />
        {/* filled track overlay */}
        <div
          className="pointer-events-none absolute left-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-[image:var(--gradient-progress)]"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
