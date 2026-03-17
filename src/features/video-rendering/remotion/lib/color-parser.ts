/**
 * Parses human-readable color scheme descriptions into hex values.
 * E.g. "Dark blue with yellow accent" → { primary: '#1e3a5f', accent: '#f59e0b' }
 */

const COLOR_MAP: Record<string, string> = {
  // Blues
  'dark blue': '#1e3a5f',
  'navy': '#0a1628',
  'blue': '#3b82f6',
  'light blue': '#93c5fd',
  'sky blue': '#38bdf8',
  'royal blue': '#4338ca',
  // Purples
  'purple': '#8b5cf6',
  'violet': '#7c3aed',
  'dark purple': '#4c1d95',
  'lavender': '#c4b5fd',
  // Reds
  'red': '#ef4444',
  'dark red': '#991b1b',
  'crimson': '#dc2626',
  // Greens
  'green': '#22c55e',
  'dark green': '#166534',
  'emerald': '#10b981',
  'teal': '#14b8a6',
  // Yellows & Oranges
  'yellow': '#eab308',
  'gold': '#f59e0b',
  'amber': '#f59e0b',
  'orange': '#f97316',
  // Neutrals
  'black': '#06070c',
  'dark': '#0f172a',
  'gray': '#6b7280',
  'white': '#f8fafc',
  // Pinks
  'pink': '#ec4899',
  'magenta': '#d946ef',
  'coral': '#fb7185',
};

export interface ParsedColors {
  primary: string;
  accent: string;
  background: string;
}

export function parseColorScheme(colorScheme: string): ParsedColors {
  const lower = colorScheme.toLowerCase();

  let primary = '#8b5cf6'; // default violet
  let accent = '#f59e0b';  // default amber

  // Find the longest matching color name
  const sortedColors = Object.entries(COLOR_MAP).sort(
    ([a], [b]) => b.length - a.length
  );

  const found: string[] = [];
  for (const [name, hex] of sortedColors) {
    if (lower.includes(name) && found.length < 2) {
      found.push(hex);
    }
  }

  if (found.length >= 2) {
    primary = found[0]!;
    accent = found[1]!;
  } else if (found.length === 1) {
    primary = found[0]!;
  }

  // Background is always a darkened version of primary
  const background = darken(primary, 0.7);

  return { primary, accent, background };
}

function darken(hex: string, amount: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);

  const dr = Math.round(r * (1 - amount));
  const dg = Math.round(g * (1 - amount));
  const db = Math.round(b * (1 - amount));

  return `#${dr.toString(16).padStart(2, '0')}${dg.toString(16).padStart(2, '0')}${db.toString(16).padStart(2, '0')}`;
}

export function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
