/** One place that turns catalogue data into the strings a buyer reads. */

export type Rtp = number | 'configurable';
export type MaxWin = { value: number; unit: 'x' | 'coins'; approx?: boolean };
export type Volatility = 'low' | 'medium' | 'high' | 'very_high';

/** 0.945 becomes "94.5%", the way the industry writes it. */
export function rtp(v: Rtp): string {
  return v === 'configurable' ? 'Configurable' : `${(v * 100).toFixed(1)}%`;
}

export function maxWin(m?: MaxWin): string | null {
  if (!m) return null;
  const n = m.value.toLocaleString('en-US');
  return m.unit === 'x' ? `${n}x${m.approx ? '+' : ''}` : `${n}${m.approx ? '+' : ''} coins`;
}

const VOL_LABEL: Record<Volatility, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  very_high: 'Very high',
};

export function volatility(v: Volatility[]): string {
  if (v.length > 2) return 'Adjustable';
  return v.map((x) => VOL_LABEL[x]).join(' / ');
}

export function bet(b?: { min: number; max: number }): string | null {
  if (!b) return null;
  const f = (n: number) => n.toFixed(2);
  return `${f(b.min)} - ${f(b.max)}`;
}

export const TYPE_LABEL = { slot: 'Slot', instant: 'Instant', table: 'Table' } as const;
export const TYPE_PLURAL = { slot: 'Slots', instant: 'Instant & crash', table: 'Table' } as const;

/**
 * The demo URL is built here from structured data, never stored as a string.
 * lobbyUrl is derived from the page's own slug, so a demo can no longer send
 * a player back to a different game's page.
 */
export function demoUrl(
  demo:
    | { mode: 'adapter'; gameId: string }
    | { mode: 'direct'; build: string; version: number; apiHost?: string },
  slug: string,
  origin = 'https://acegames.io',
): string {
  if (demo.mode === 'adapter') {
    const lobby = `${origin}/portfolio/${slug}`;
    return (
      'https://adapter-api-demo.rstars.cc/api/external/game/start' +
      `?gameId=${encodeURIComponent(demo.gameId)}&redirect=true&lobbyUrl=${encodeURIComponent(lobby)}`
    );
  }
  const base = `https://cdn.rstars.cc/${demo.build}/${demo.version}/index.html`;
  return demo.apiHost ? `${base}?host=${demo.apiHost}` : base;
}
