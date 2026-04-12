import type { LiveGameData } from '@/hooks/useLiveProps'
import { FreshnessIndicator } from './FreshnessIndicator'

interface Props {
  gameData: LiveGameData
  isSelected: boolean
  onSelect: () => void
}

export function LiveScoreBanner({ gameData, isSelected, onSelect }: Props) {
  const { game } = gameData

  return (
    <button
      onClick={onSelect}
      className={`w-full text-left p-3 rounded-lg border transition-colors mb-2 ${
        isSelected
          ? 'border-green-500 bg-green-950'
          : 'border-gray-700 bg-gray-900 hover:border-gray-500'
      }`}
    >
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-3'>
          <span className='text-xs bg-red-600 text-white px-2 py-0.5 rounded font-bold animate-pulse'>
            LIVE
          </span>
          <span className='text-white font-medium text-sm'>
            {game.awayTeam} {game.awayScore} — {game.homeScore} {game.homeTeam}
          </span>
        </div>
        <div className='flex items-center gap-2'>
          <span className='text-gray-400 text-xs'>Q{game.period}</span>
          {gameData.blowout && (
            <span className='text-xs text-orange-400 font-medium'>Blowout</span>
          )}
          <FreshnessIndicator lastUpdated={gameData.generatedAt} />
        </div>
      </div>
    </button>
  )
}