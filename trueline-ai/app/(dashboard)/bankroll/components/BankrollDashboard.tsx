'use client';

import { useState } from 'react';
import { updateRiskTier } from '../actions';

interface Bankroll {
  id: string;
  bankrollAmount: string;
  initialBankroll: string;
  peakBankroll: string;
  riskTier: string;
  totalWagered: string;
  totalWon: string;
  totalLost: string;
  winCount: number;
  lossCount: number;
  currentStreak: number;
  maxDrawdownPct: string | null;
}

interface BetOutcome {
  id: string;
  stakeAmount: string;
  potentialPayout: string;
  oddsAtPlacement: string;
  sportsbook: string | null;
  outcome: string;
  placedAt: Date;
}

export function BankrollDashboard({
  bankroll,
  betHistory,
}: {
  bankroll: Bankroll;
  betHistory: BetOutcome[];
}) {
  const [riskTier, setRiskTier] = useState(bankroll.riskTier);
  const [saving, setSaving] = useState(false);

  const balance = parseFloat(bankroll.bankrollAmount);
  const initial = parseFloat(bankroll.initialBankroll);
  const wagered = parseFloat(bankroll.totalWagered);
  const won = parseFloat(bankroll.totalWon);
  const lost = parseFloat(bankroll.totalLost);
  const maxDD = parseFloat(bankroll.maxDrawdownPct ?? '0');
  const roi = wagered > 0 ? ((won - lost) / wagered) * 100 : 0;

  const handleRiskChange = async (tier: 'conservative' | 'standard' | 'aggressive') => {
    setSaving(true);
    setRiskTier(tier);
    await updateRiskTier(tier);
    setSaving(false);
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#ffffff' }}>Bankroll Manager</h1>

      {/* Stat Cards */}
<div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        <StatCard          title="Current Balance"
          value={`$${balance.toFixed(2)}`}
          sub={`Started: $${initial.toFixed(2)}`}
          valueColor={balance >= initial ? '#00ff87' : '#f87171'}
        />
        <StatCard
          title="ROI"
          value={`${roi >= 0 ? '+' : ''}${roi.toFixed(1)}%`}
          sub={`$${wagered.toFixed(2)} wagered`}
          valueColor={roi >= 0 ? '#00ff87' : '#f87171'}
        />
        <StatCard
          title="Record"
          value={`${bankroll.winCount}W – ${bankroll.lossCount}L`}
          sub={`Streak: ${bankroll.currentStreak > 0 ? '+' : ''}${bankroll.currentStreak}`}
          valueColor="#ffffff"
        />
        <StatCard
          title="Max Drawdown"
          value={`${maxDD.toFixed(1)}%`}
          sub="Peak to trough"
          valueColor={maxDD > 20 ? '#f87171' : '#fbbf24'}
        />
      </div>

      {/* Risk Tier Selector */}
      <div style={{ backgroundColor: '#111118', border: '1px solid #2a2a3a', borderRadius: '16px', padding: '24px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#ffffff', marginBottom: '4px' }}>Risk Tier</h2>
        <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '16px' }}>
          Controls how aggressively Kelly sizes your bets.
          {saving && <span style={{ color: '#00ff87', marginLeft: '8px' }}>Saving...</span>}
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
          {([
            { tier: 'conservative', label: 'Conservative', kelly: '0.25×', desc: 'Lowest variance' },
            { tier: 'standard', label: 'Standard', kelly: '0.5×', desc: 'Recommended' },
            { tier: 'aggressive', label: 'Aggressive', kelly: '1.0×', desc: 'Full Kelly' },
          ] as const).map(({ tier, label, kelly, desc }) => (
            <button
              key={tier}
              onClick={() => handleRiskChange(tier)}
              style={{
                padding: '16px',
                borderRadius: '12px',
                border: riskTier === tier ? '1px solid rgba(0,255,135,0.5)' : '1px solid #2a2a3a',
                backgroundColor: riskTier === tier ? 'rgba(0,255,135,0.1)' : '#1a1a24',
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              <div style={{ fontWeight: 600, color: riskTier === tier ? '#00ff87' : '#ffffff', fontSize: '15px' }}>{label}</div>
              <div style={{ color: '#00ff87', fontSize: '13px', marginTop: '2px' }}>{kelly} Kelly</div>
              <div style={{ color: '#6b7280', fontSize: '12px', marginTop: '4px' }}>{desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Bet History */}
      <div style={{ backgroundColor: '#111118', border: '1px solid #2a2a3a', borderRadius: '16px', padding: '24px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#ffffff', marginBottom: '16px' }}>Bet History</h2>
        {betHistory.length === 0 ? (
          <p style={{ color: '#6b7280', fontSize: '14px' }}>No bets logged yet. Click "Log This Bet" on any parlay card to get started.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', fontSize: '14px', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #2a2a3a' }}>
                  {['Date', 'Sportsbook', 'Stake', 'To Win', 'Result'].map((h, i) => (
                    <th key={h} style={{ color: '#6b7280', fontWeight: 500, padding: '0 0 12px', textAlign: i > 1 ? 'right' : 'left' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {betHistory.map((bet) => (
                  <tr key={bet.id} style={{ borderBottom: '1px solid #1e1e2a' }}>
                    <td style={{ padding: '12px 0', color: '#d1d5db' }}>{new Date(bet.placedAt).toLocaleDateString()}</td>
                    <td style={{ padding: '12px 0', color: '#d1d5db' }}>{bet.sportsbook ?? '—'}</td>
                    <td style={{ padding: '12px 0', color: '#d1d5db', textAlign: 'right' }}>${parseFloat(bet.stakeAmount).toFixed(2)}</td>
                    <td style={{ padding: '12px 0', color: '#d1d5db', textAlign: 'right' }}>${parseFloat(bet.potentialPayout ?? '0').toFixed(2)}</td>
                    <td style={{ padding: '12px 0', textAlign: 'right' }}>
                      <span style={{
                        padding: '3px 10px',
                        borderRadius: '999px',
                        fontSize: '12px',
                        fontWeight: 600,
                        backgroundColor: bet.outcome === 'won' ? 'rgba(0,255,135,0.1)' : bet.outcome === 'lost' ? 'rgba(248,113,113,0.1)' : 'rgba(107,114,128,0.2)',
                        color: bet.outcome === 'won' ? '#00ff87' : bet.outcome === 'lost' ? '#f87171' : '#9ca3af',
                      }}>
                        {bet.outcome}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ title, value, sub, valueColor }: {
  title: string; value: string; sub: string; valueColor: string;
}) {
  return (
    <div style={{ backgroundColor: '#111118', border: '1px solid #2a2a3a', borderRadius: '16px', padding: '20px' }}>
      <p style={{ fontSize: '11px', color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>{title}</p>
      <p style={{ fontSize: '26px', fontWeight: 700, color: valueColor }}>{value}</p>
      <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>{sub}</p>
    </div>
  );
}