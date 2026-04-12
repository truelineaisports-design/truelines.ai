'use client'
import { useState } from 'react'
import { useLiveProps } from '@/hooks/useLiveProps'
import { LiveScoreBanner } from '@/components/live-props/LiveScoreBanner'
import { PropSuggestionCard } from '@/components/live-props/PropSuggestionCard'

export default function LivePropsPage() {
  const { data, isLoading, isError, dataUpdatedAt } = useLiveProps()
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null)

  const games = data?.games ?? []
  const displayGameId = selectedGameId ?? games[0]?.game?.gameId ?? null
  const selectedGame = games.find(g => g.game.gameId === displayGameId)

  return (
    <div className='max-w-lg mx-auto py-6 px-4'>
      <div className='flex items-center justify-between mb-4'>
        <h1 className='text-2xl font-bold text-white'>Live Props</h1>
        <span className='text-xs text-gray-500'>
          {dataUpdatedAt ? `Updated ${new Date(dataUpdatedAt).toLocaleTimeString()}` : ''}
        </span>
      </div>

      {isLoading && (
        <div className='space-y-2'>
          {[1,2,3].map(i => (
            <div key={i} className='h-16 bg-gray-800 rounded-lg animate-pulse' />
          ))}
        </div>
      )}

      {isError && (
        <div className='bg-red-950 border border-red-800 rounded-xl p-4 text-red-300'>
          Failed to load live props. Will retry automatically.
        </div>
      )}

      {!isLoading && !isError && !data?.gamesLive && (
        <div className='bg-gray-900 border border-gray-800 rounded-xl p-8 text-center'>
          <p className='text-4xl mb-3'>🏀</p>
          <p className='text-white font-medium mb-1'>No Live Games Right Now</p>
          <p className='text-gray-500 text-sm'>
            {data?.message ?? 'Check back during game time (7 PM – 1 AM ET)'}
          </p>
        </div>
      )}

      {!isLoading && data?.gamesLive && (
        <>
          <div className='mb-4'>
            <p className='text-gray-500 text-xs mb-2 uppercase tracking-wide'>
              Select a game
            </p>
            {games.map(g => (
              <LiveScoreBanner
                key={g.game.gameId}
                gameData={g}
                isSelected={g.game.gameId === displayGameId}
                onSelect={() => setSelectedGameId(g.game.gameId)}
              />
            ))}
          </div>

          {selectedGame && (
            <div>
              <p className='text-gray-500 text-xs mb-3 uppercase tracking-wide'>
                Prop suggestions — {selectedGame.game.awayTeam} at {selectedGame.game.homeTeam}
              </p>

              {selectedGame.blowout && (
                <div className='bg-orange-950 border border-orange-800 rounded-xl p-3 mb-3 text-orange-300 text-sm'>
                  Game is in garbage time. Props disabled.
                </div>
              )}

              {!selectedGame.blowout && selectedGame.suggestions.length === 0 && (
                <div className='bg-gray-900 border border-gray-800 rounded-xl p-4 text-center'>
                  <p className='text-gray-400 text-sm'>
                    No strong edges detected yet.
                  </p>
                  <p className='text-gray-600 text-xs mt-1'>
                    An edge appears when a player is pacing 20%+ above or below their prop line.
                  </p>
                </div>
              )}

              {selectedGame.suggestions.map((s, i) => (
                <PropSuggestionCard key={i} suggestion={s} />
              ))}
            </div>
          )}
        </>
      )}

      <p className='text-gray-600 text-xs text-center mt-8 leading-relaxed'>
        For entertainment purposes only. Not financial or gambling advice.
        Sports betting involves financial risk.
      </p>
    </div>
  )
}