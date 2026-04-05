'use client'
export default function ParlayPage() {
  return (
    <div className="max-w-lg mx-auto py-6">
      <h1 className="text-2xl font-bold text-white mb-2">Tonight's Parlays</h1>
      <p className="text-gray-400 mb-6">AI-generated NBA parlays</p>
      {[1, 2, 3].map((n) => (
        <div key={n} className="bg-gray-900 rounded-xl p-4 mb-4 border border-gray-800">
          <div className="flex justify-between items-center mb-3">
            <span className="text-blue-400 font-semibold">Parlay #{n}</span>
            <span className="text-emerald-400 text-sm">+450</span>
          </div>
          <div className="h-4 bg-gray-800 rounded animate-pulse mb-2" />
          <div className="h-4 bg-gray-800 rounded animate-pulse w-3/4" />
        </div>
      ))}
    </div>
  )
}