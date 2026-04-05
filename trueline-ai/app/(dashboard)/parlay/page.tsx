'use client'
import { useGames } from '@/hooks/useGames'

export default function ParlayPage() {
  const { data: games, isLoading, isError } = useGames()

  return (
    <div className="max-w-lg mx-auto py-6">
      <h1 className="text-2xl font-bold text-white mb-2">Tonight's Games</h1>

      {isLoading && [1,2,3].map((n) => (
        <div key={n} className="bg-gray-900 rounded-xl p-4 mb-3 border border-gray-800">
          <div className="h-5 bg-gray-800 rounded animate-pulse mb-2 w-3/4" />
          <div className="h-4 bg-gray-800 rounded animate-pulse w-1/2" />
        </div>
      ))}

      {isError && (
        <div className="bg-red-900/20 border border-red-800 rounded-xl p-4">
          <p className="text-red-400">Could not load games. Please try again.</p>
        </div>
      )}

      {games?.length === 0 && (
        <p className="text-gray-500 text-center py-8">No games tonight.</p>
      )}

      {games?.map((game: any) => (
        <div key={game.id} className="bg-gray-900 rounded-xl p-4 mb-3 border border-gray-800">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-white font-semibold">
                {game.awayTeamAbbr} @ {game.homeTeamAbbr}
              </p>
              <p className="text-gray-400 text-sm">
                {new Date(game.scheduledAt).toLocaleTimeString([],
                  { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
            <span className="text-xs text-gray-500 uppercase">{game.status}</span>
          </div>
        </div>
      ))}
    </div>
  )
}