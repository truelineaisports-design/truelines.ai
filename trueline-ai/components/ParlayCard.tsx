'use client';

import { useState } from 'react';
import { logBet } from '@/app/(dashboard)/bankroll/actions';
import { calculateStake, potentialPayout } from '@/lib/kelly';

interface ParlayLeg {
  id: string;
  selection: string;
  betType: string;
  odds: string;
  line: string | null;
  modelProbability: string | null;
}

interface Parlay {
  id: string;
  confidence: string;
  combinedOdds: string;
  rationale: string;
  isFeatured: boolean;
  outcome: string;
  legs: ParlayLeg[];
}

interface ParlayCardProps {
  parlay: Parlay;
  isPro: boolean;
  rank: number;
  bankroll?: { bankrollAmount: string; riskTier: string } | null;
}

export default function ParlayCard({ parlay, isPro, rank, bankroll }: ParlayCardProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [stake, setStake] = useState('');
  const [sportsbook, setSportsbook] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const confidenceStyles = {
    high: { color: '#00ff87', background: 'rgba(0,255,135,0.1)', border: '1px solid rgba(0,255,135,0.3)' },
    medium: { color: '#fbbf24', background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.3)' },
    low: { color: '#f87171', background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)' },
  }[parlay.confidence] || { color: '#9ca3af', background: 'rgba(156,163,175,0.1)', border: '1px solid rgba(156,163,175,0.3)' };

  const formatOdds = (odds: string) => {
    const num = parseFloat(odds);
    return num > 0 ? `+${num}` : `${num}`;
  };

  const getKellyStake = () => {
    if (!bankroll) return 0;
    const balance = parseFloat(bankroll.bankrollAmount);
    const odds = parseFloat(parlay.combinedOdds);
    const legs = parlay.legs.filter(l => l.modelProbability);
    if (legs.length === 0) return 0;
    const avgProb = legs.reduce((sum, l) => sum + parseFloat(l.modelProbability!), 0) / legs.length;
    const riskTier = bankroll.riskTier as 'conservative' | 'standard' | 'aggressive';
    return calculateStake(balance, odds, avgProb, riskTier);
  };

  const kellyStake = getKellyStake();
  const estimatedPayout = stake
    ? potentialPayout(parseFloat(stake), parseFloat(parlay.combinedOdds))
    : 0;

  const handleOpenModal = () => {
    setStake(kellyStake > 0 ? kellyStake.toFixed(2) : '');
    setMessage('');
    setModalOpen(true);
  };

  const handleLogBet = async () => {
    if (!stake || parseFloat(stake) <= 0) {
      setMessage('Please enter a valid stake amount.');
      return;
    }
    if (!sportsbook.trim()) {
      setMessage('Please select a sportsbook.');
      return;
    }
    setLoading(true);
    const result = await logBet({
      parlayId: parlay.id,
      stakeAmount: parseFloat(stake),
      potentialPayout: estimatedPayout,
      kellyStakePct: bankroll ? parseFloat(stake) / parseFloat(bankroll.bankrollAmount) : 0,
      oddsAtPlacement: parseFloat(parlay.combinedOdds),
      sportsbook: sportsbook.trim(),
    });
    setLoading(false);
    if (result.success) {
      setMessage('✅ Bet logged!');
      setTimeout(() => setModalOpen(false), 1500);
    } else {
      setMessage(result.message ?? 'Something went wrong.');
    }
  };

  return (
    <>
      <div style={{ backgroundColor: '#111118', border: '1px solid #2a2a3a', borderRadius: '12px', overflow: 'hidden' }}>
        
        {/* Card Header */}
        <div style={{ padding: '20px', borderBottom: '1px solid #2a2a3a', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ color: '#6b7280', fontSize: '14px', fontWeight: 500 }}>Parlay #{rank}</span>
            <span style={{ ...confidenceStyles, fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '999px' }}>
              {parlay.confidence.toUpperCase()} CONFIDENCE
            </span>
            {parlay.isFeatured && (
              <span style={{ color: '#00ff87', background: 'rgba(0,255,135,0.1)', border: '1px solid rgba(0,255,135,0.3)', fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '999px' }}>
                FEATURED
              </span>
            )}
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#ffffff' }}>{formatOdds(parlay.combinedOdds)}</div>
            <div style={{ fontSize: '12px', color: '#6b7280' }}>Combined odds</div>
          </div>
        </div>

        {/* Legs */}
        {(parlay.legs || []).map((leg, i) => (
          <div key={leg.id} style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: i < parlay.legs.length - 1 ? '1px solid #1e1e2a' : undefined }}>
            <div>
              <div style={{ color: '#ffffff', fontWeight: 500 }}>{leg.selection}</div>
              <div style={{ color: '#6b7280', fontSize: '13px', textTransform: 'capitalize' }}>{leg.betType.replace('_', ' ')}</div>
            </div>
            <div style={{ textAlign: 'right', marginLeft: '16px' }}>
              <div style={{ color: '#ffffff', fontWeight: 700 }}>{formatOdds(leg.odds)}</div>
              {isPro && leg.modelProbability && (
                <div style={{ color: '#00ff87', fontSize: '12px' }}>
                  AI: {Math.round(parseFloat(leg.modelProbability) * 100)}%
                </div>
              )}
            </div>
          </div>
        ))}

        {/* AI Analysis */}
        <div style={{ padding: '20px', borderTop: '1px solid #2a2a3a' }}>
          <p style={{ fontSize: '11px', color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>AI Analysis</p>
          {isPro ? (
            <p style={{ color: '#d1d5db', fontSize: '14px', lineHeight: 1.6 }}>{parlay.rationale}</p>
          ) : (
            <div style={{ position: 'relative' }}>
              <p style={{ color: '#d1d5db', fontSize: '14px', lineHeight: 1.6, filter: 'blur(4px)', userSelect: 'none' }}>{parlay.rationale}</p>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <a href="/pricing" style={{ backgroundColor: '#7c3aed', color: '#ffffff', fontSize: '13px', fontWeight: 700, padding: '8px 16px', borderRadius: '8px', textDecoration: 'none' }}>
                  Upgrade to see analysis
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Log This Bet Button */}
        <div style={{ padding: '0 20px 20px' }}>
          <button
            onClick={handleOpenModal}
            style={{ width: '100%', backgroundColor: '#00ff87', color: '#0a0a0f', fontWeight: 700, padding: '12px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '14px' }}
          >
            {kellyStake > 0 ? `Log This Bet — Kelly suggests $${kellyStake.toFixed(2)}` : 'Log This Bet'}
          </button>
        </div>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '16px' }}>
          <div style={{ backgroundColor: '#111118', border: '1px solid #2a2a3a', borderRadius: '16px', width: '100%', maxWidth: '420px', padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
              <h2 style={{ color: '#ffffff', fontSize: '20px', fontWeight: 700 }}>Log This Bet</h2>
              <button onClick={() => setModalOpen(false)} style={{ color: '#6b7280', background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', lineHeight: 1 }}>×</button>
            </div>

            {kellyStake > 0 && (
              <div style={{ backgroundColor: 'rgba(0,255,135,0.1)', border: '1px solid rgba(0,255,135,0.3)', borderRadius: '8px', padding: '12px', marginBottom: '20px' }}>
                <p style={{ color: '#00ff87', fontSize: '14px' }}>
                  Kelly recommends: <strong style={{ color: '#ffffff' }}>${kellyStake.toFixed(2)}</strong>
                  <span style={{ color: '#00cc6a', marginLeft: '8px' }}>({bankroll?.riskTier} tier)</span>
                </p>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#d1d5db', marginBottom: '8px' }}>Stake Amount ($)</label>
                <input
                  type="number"
                  value={stake}
                  onChange={(e) => setStake(e.target.value)}
                  style={{ width: '100%', backgroundColor: '#1a1a24', color: '#ffffff', border: '1px solid #2a2a3a', borderRadius: '8px', padding: '12px 16px', fontSize: '16px', outline: 'none', boxSizing: 'border-box' }}
                  placeholder="0.00"
                  min="0.01"
                  step="0.01"
                />
                {stake && parseFloat(stake) > 0 && (
                  <p style={{ color: '#6b7280', fontSize: '12px', marginTop: '4px' }}>
                    Potential payout: <span style={{ color: '#00ff87' }}>${estimatedPayout.toFixed(2)}</span>
                  </p>
                )}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#d1d5db', marginBottom: '8px' }}>Sportsbook</label>
                <select
                  value={sportsbook}
                  onChange={(e) => setSportsbook(e.target.value)}
                  style={{ width: '100%', backgroundColor: '#1a1a24', color: '#ffffff', border: '1px solid #2a2a3a', borderRadius: '8px', padding: '12px 16px', fontSize: '16px', outline: 'none', boxSizing: 'border-box' }}
                >
                  <option value="">Select a sportsbook...</option>
                  <option value="DraftKings">DraftKings</option>
                  <option value="FanDuel">FanDuel</option>
                  <option value="BetMGM">BetMGM</option>
                  <option value="Caesars">Caesars</option>
                  <option value="ESPN Bet">ESPN Bet</option>
                  <option value="PointsBet">PointsBet</option>
                  <option value="Bet365">Bet365</option>
                  <option value="Hard Rock Bet">Hard Rock Bet</option>
                </select>
              </div>
            </div>

            {message && (
              <p style={{ marginTop: '16px', fontSize: '14px', color: message.startsWith('✅') ? '#00ff87' : '#f87171' }}>
                {message}
              </p>
            )}

            <button
              onClick={handleLogBet}
              disabled={loading}
              style={{ width: '100%', marginTop: '24px', backgroundColor: loading ? '#00cc6a' : '#00ff87', color: '#0a0a0f', fontWeight: 700, padding: '12px', borderRadius: '8px', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', fontSize: '16px', opacity: loading ? 0.7 : 1 }}
            >
              {loading ? 'Logging...' : 'Confirm Bet'}
            </button>
          </div>
        </div>
      )}
    </>
  );
}