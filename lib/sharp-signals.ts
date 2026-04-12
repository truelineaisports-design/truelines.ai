// src/lib/sharp-signals.ts

export interface OddsSnapshot {
  bookmaker: string;
  point: number | null;
  price: number;
  captured_at: Date;
}

export interface LineMovementRecord {
  bookmaker: string;
  market_type: string;
  previous_line: number | null;
  current_line: number | null;
  movement_pct: number | null;
  captured_at: Date;
}

export interface SharpSignalResult {
  hasPinnacleDiv: boolean;
  pinnacleGap: number;
  pinnacleDirection: string;
  hasRLM: boolean;
  rlmDirection: string;
  hasSteamMove: boolean;
  steamBookmakers: string[];
  sharpScore: number;
  signalSummary: string;
}

export function detectPinnacleDivergence(
  snapshots: OddsSnapshot[],
  marketType: 'spreads' | 'totals'
): { detected: boolean; gap: number; direction: string } {
  const threshold = marketType === 'spreads' ? 1.0 : 0.5;
  const RETAIL_BOOKS = ['draftkings', 'fanduel', 'betmgm', 'caesars', 'pointsbet'];
  const PINNACLE_KEY = 'pinnacle';

  const pinnacleSnap = snapshots.find(
    (s) => s.bookmaker.toLowerCase() === PINNACLE_KEY
  );
  if (!pinnacleSnap || pinnacleSnap.point === null) {
    return { detected: false, gap: 0, direction: 'none' };
  }

  const retailSnaps = snapshots.filter(
    (s) => RETAIL_BOOKS.includes(s.bookmaker.toLowerCase()) && s.point !== null
  );
  if (retailSnaps.length === 0) {
    return { detected: false, gap: 0, direction: 'none' };
  }

  const avgRetail =
    retailSnaps.reduce((sum, s) => sum + (s.point as number), 0) / retailSnaps.length;
  const gap = pinnacleSnap.point - avgRetail;
  const absGap = Math.abs(gap);
  const direction = gap > 0 ? 'away_favored' : gap < 0 ? 'home_favored' : 'none';

  return { detected: absGap >= threshold, gap: absGap, direction };
}

export function detectReverseLineMovement(
  openingLine: number | null,
  currentLine: number | null,
  publicBetPct: number | null,
  marketType: 'spreads' | 'totals'
): { detected: boolean; direction: string } {
  if (openingLine === null || currentLine === null || publicBetPct === null) {
    return { detected: false, direction: 'no_data' };
  }

  const movement = currentLine - openingLine;
  const publicFavoringFavorite = publicBetPct > 55;

  let rlmDetected = false;
  let direction = 'none';

  if (marketType === 'spreads') {
    if (publicFavoringFavorite && movement > 0.3) {
      rlmDetected = true;
      direction = 'sharp_on_underdog';
    } else if (!publicFavoringFavorite && movement < -0.3) {
      rlmDetected = true;
      direction = 'sharp_on_favorite';
    }
  } else {
    if (publicFavoringFavorite && movement < -0.3) {
      rlmDetected = true;
      direction = 'sharp_on_under';
    } else if (!publicFavoringFavorite && movement > 0.3) {
      rlmDetected = true;
      direction = 'sharp_on_over';
    }
  }

  return { detected: rlmDetected, direction };
}

export function detectSteamMove(
  recentMovements: LineMovementRecord[],
  windowMinutes: number = 10
): { detected: boolean; bookmakers: string[] } {
  if (recentMovements.length < 3) {
    return { detected: false, bookmakers: [] };
  }

  const now = new Date();
  const windowStart = new Date(now.getTime() - windowMinutes * 60 * 1000);

  const windowMovements = recentMovements.filter((m) => {
    return (
      m.captured_at >= windowStart &&
      m.previous_line !== null &&
      m.current_line !== null
    );
  });

  if (windowMovements.length < 3) {
    return { detected: false, bookmakers: [] };
  }

  const movementsWithDir = windowMovements.map((m) => ({
    bookmaker: m.bookmaker,
    direction: (m.current_line as number) > (m.previous_line as number) ? 1 : -1,
  }));

  const upMovers = movementsWithDir.filter((m) => m.direction === 1);
  const downMovers = movementsWithDir.filter((m) => m.direction === -1);

  if (upMovers.length >= 3) {
    return { detected: true, bookmakers: upMovers.map((m) => m.bookmaker) };
  }
  if (downMovers.length >= 3) {
    return { detected: true, bookmakers: downMovers.map((m) => m.bookmaker) };
  }

  return { detected: false, bookmakers: [] };
}

export function calculateSharpSignals(
  snapshots: OddsSnapshot[],
  recentMovements: LineMovementRecord[],
  openingLine: number | null,
  currentLine: number | null,
  publicBetPct: number | null,
  marketType: 'spreads' | 'totals'
): SharpSignalResult {
  const pin = detectPinnacleDivergence(snapshots, marketType);
  const rlm = detectReverseLineMovement(openingLine, currentLine, publicBetPct, marketType);
  const steam = detectSteamMove(recentMovements);

  const sharpScore = [pin.detected, rlm.detected, steam.detected].filter(Boolean).length;

  const parts: string[] = [];
  if (pin.detected) {
    parts.push(`Pinnacle divergence of ${pin.gap.toFixed(1)} points (${pin.direction.replace('_', ' ')})`);
  }
  if (rlm.detected) {
    parts.push(`Reverse line movement detected — ${rlm.direction.replace(/_/g, ' ')}`);
  }
  if (steam.detected) {
    parts.push(`Steam move across ${steam.bookmakers.join(', ')}`);
  }

  return {
    hasPinnacleDiv: pin.detected,
    pinnacleGap: pin.gap,
    pinnacleDirection: pin.direction,
    hasRLM: rlm.detected,
    rlmDirection: rlm.direction,
    hasSteamMove: steam.detected,
    steamBookmakers: steam.bookmakers,
    sharpScore,
    signalSummary: parts.length > 0 ? parts.join('; ') : 'No sharp signals detected',
  };
}