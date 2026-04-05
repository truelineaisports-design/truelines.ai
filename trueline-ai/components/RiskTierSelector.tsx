'use client'
import { useAppStore } from '@/lib/stores/appStore'

export default function RiskTierSelector() {
  const riskTier = useAppStore((state) => state.riskTier)
  const setRiskTier = useAppStore((state) => state.setRiskTier)

  const tiers = [
    { id: 'conservative', label: 'Conservative', desc: '0.25× Kelly — safest' },
    { id: 'standard', label: 'Standard', desc: '0.5× Kelly — recommended' },
    { id: 'aggressive', label: 'Aggressive', desc: '1.0× Kelly — high risk' },
  ] as const

  return (
    <div className="space-y-3">
      {tiers.map((tier) => (
        <button key={tier.id}
          onClick={() => setRiskTier(tier.id)}
          className={`w-full p-4 rounded-xl border text-left transition-colors
            ${riskTier === tier.id
              ? "border-blue-500 bg-blue-500/10"
              : "border-gray-700 bg-gray-900"
            }`}
        >
          <p className="font-semibold text-white">{tier.label}</p>
          <p className="text-sm text-gray-400">{tier.desc}</p>
        </button>
      ))}
    </div>
  )
}