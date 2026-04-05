import RiskTierSelector from '@/components/RiskTierSelector'

export default function BankrollPage() {
  return (
    <div className="max-w-lg mx-auto py-6">
      <h1 className="text-2xl font-bold text-white mb-2">Bankroll Manager</h1>
      <p className="text-gray-400 mb-6">Kelly Criterion stake sizing</p>
      <RiskTierSelector />
    </div>
  )
}