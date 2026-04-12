import type { PropSuggestion } from '@/hooks/useLiveProps'

interface Props {
  suggestion: PropSuggestion
}

const confidenceColors = {
  high:   'bg-green-900 text-green-300 border-green-700',
  medium: 'bg-yellow-900 text-yellow-300 border-yellow-700',
  low:    'bg-gray-800 text-gray-400 border-gray-600',
}

export function PropSuggestionCard({ suggestion }: Props) {
  const isOver = suggestion.direction === 'OVER'
  const directionColor = isOver ? 'text-green-400' : 'text-red-400'
  const statLabel = suggestion.stat.charAt(0).toUpperCase() + suggestion.stat.slice(1)

  return (
    <div className='bg-gray-900 border border-gray-800 rounded-xl p-4 mb-3'>
      <div className='flex items-center justify-between mb-2'>
        <div>
          <span className='text-white font-bold text-base'>{suggestion.player}</span>
          <span className='text-gray-500 text-sm ml-2'>{suggestion.team}</span>
        </div>
        <span className={`text-xs px-2 py-1 rounded-full border font-medium ${confidenceColors[suggestion.confidence]}`}>
          {suggestion.confidence.toUpperCase()}
        </span>
      </div>

      <div className='flex items-center gap-3 mb-3'>
        <span className='text-gray-400 text-sm'>{statLabel} line:</span>
        <span className='text-white font-mono text-sm'>{suggestion.propLine}</span>
        <span className={`font-bold text-lg ${directionColor}`}>
          {suggestion.direction}
        </span>
        <span className='text-gray-300 font-mono'>
          {suggestion.projected} projected
        </span>
        <span className='text-gray-500 text-xs'>
          ({suggestion.deviationPct}% edge)
        </span>
      </div>

      <p className='text-gray-400 text-sm leading-relaxed border-t border-gray-800 pt-2'>
        {suggestion.explanation}
      </p>

      <div className='mt-2 text-xs text-gray-600'>
        {suggestion.minutesPlayed} min played
      </div>
    </div>
  )
}