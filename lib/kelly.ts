// lib/kelly.ts
// Pure TypeScript Kelly Criterion calculator — no dependencies needed

export function americanToDecimal(odds: number): number {
  if (odds > 0) return (odds / 100) + 1;   // +150 → 2.50
  return (100 / Math.abs(odds)) + 1;        // -110 → 1.9091
}

export function kellyFraction(
  decimalOdds: number,
  modelProbability: number
): number {
  if (modelProbability <= 0 || modelProbability >= 1) return 0;
  const b = decimalOdds - 1;
  if (b <= 0) return 0;
  const p = modelProbability;
  const q = 1 - p;
  const f = (b * p - q) / b;
  if (!isFinite(f) || isNaN(f)) return 0;
  return Math.max(0, f);
}

export function calculateStake(
  bankroll: number,
  americanOdds: number,
  modelProbability: number,
  riskTier: 'conservative' | 'standard' | 'aggressive' = 'standard',
  maxStakePct: number = 0.05
): number {
  const decimalOdds = americanToDecimal(americanOdds);
  const kelly = kellyFraction(decimalOdds, modelProbability);
  const multiplier = riskTier === 'conservative' ? 0.25
    : riskTier === 'aggressive' ? 1.0 : 0.5;
  const adjusted = kelly * multiplier;
  const capped = Math.min(adjusted, maxStakePct);
  return Math.round(capped * bankroll * 100) / 100;
}

export function potentialPayout(
  stake: number,
  americanOdds: number
): number {
  const decimal = americanToDecimal(americanOdds);
  return Math.round(stake * decimal * 100) / 100;
}