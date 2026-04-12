'use client';

import { useState } from 'react';
import { createBankroll } from '../actions';

export function BankrollSetup() {
  const [amount, setAmount] = useState('1000');
  const [riskTier, setRiskTier] = useState<'conservative' | 'standard' | 'aggressive'>('standard');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    const parsed = parseFloat(amount);
    if (isNaN(parsed) || parsed <= 0) {
      setError('Please enter a valid amount.');
      return;
    }
    setLoading(true);
    const result = await createBankroll(parsed, riskTier);
    if (!result.success) {
      setError(result.message ?? 'Something went wrong.');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20 p-8 rounded-2xl border"
      style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
      <h1 className="text-2xl font-bold text-white mb-2">Set Up Your Bankroll</h1>
      <p className="text-gray-400 mb-8">Enter your starting bankroll and choose your risk style. You can change this anytime.</p>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-300 mb-2">Starting Bankroll ($)</label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full text-white rounded-lg px-4 py-3 text-lg focus:outline-none border"
          style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}
          placeholder="1000"
          min="1"
        />
      </div>

      <div className="mb-8">
        <label className="block text-sm font-medium text-gray-300 mb-3">Risk Tier</label>
        <div className="grid grid-cols-3 gap-3">
          {(['conservative', 'standard', 'aggressive'] as const).map((tier) => (
            <button
              key={tier}
              onClick={() => setRiskTier(tier)}
              className="py-3 px-2 rounded-lg text-sm font-medium capitalize transition-colors border"
              style={{
                background: riskTier === tier ? 'rgba(0,255,135,0.15)' : 'var(--surface-2)',
                borderColor: riskTier === tier ? 'var(--brand-green)' : 'var(--border)',
                color: riskTier === tier ? 'var(--brand-green)' : '#9ca3af',
              }}
            >
              {tier}
              <span className="block text-xs mt-1 opacity-70">
                {tier === 'conservative' ? '0.25× Kelly'
                  : tier === 'standard' ? '0.5× Kelly'
                  : '1.0× Kelly'}
              </span>
            </button>
          ))}
        </div>
      </div>

      {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full font-bold py-3 rounded-lg transition-colors text-black"
        style={{ background: loading ? '#00cc6a88' : 'var(--brand-green)' }}
      >
        {loading ? 'Setting up...' : 'Start Tracking'}
      </button>
    </div>
  );
}