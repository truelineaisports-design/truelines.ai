// components/fade/FadeClient.tsx
'use client';

import { useQuery } from '@tanstack/react-query';
import { FadeGameCard } from './FadeGameCard';

interface FadeGame {
  gameId: string;
  homeTeam: string;
  awayTeam: string;
  scheduledAt: string;
  narrative: string;
  lineMovementCount: number;
  signals: {
    sharpScore: number;
    hasPinnacleDiv: boolean;
    pinnacleGap: number;
    hasRLM: boolean;
    rlmDirection: string;
    hasSteamMove: boolean;
    steamBookmakers: string[];
  };
}

async function fetchFadeData(): Promise<{ games: FadeGame[]; message?: string }> {
  const res = await fetch('/api/fade');
  if (!res.ok) throw new Error('Failed to load sharp money data');
  return res.json();
}

export function FadeClient() {
  const { data, isLoading, isError, dataUpdatedAt } = useQuery({
    queryKey: ['fade-data'],
    queryFn: fetchFadeData,
    refetchInterval: 5 * 60 * 1000,
    staleTime: 3 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className='space-y-4'>
        {[1, 2, 3].map((i) => (
          <div key={i} className='bg-[#0d1b2a] rounded-xl border border-gray-700 p-5 animate-pulse'>
            <div className='h-6 bg-gray-700 rounded w-1/2 mb-4' />
            <div className='h-3 bg-gray-700 rounded w-full mb-2' />
            <div className='h-3 bg-gray-700 rounded w-3/4' />
          </div>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className='bg-red-900/20 border border-red-700 rounded-xl p-6 text-center'>
        <p className='text-red-400 font-semibold'>Failed to load sharp money data.</p>
        <p className='text-gray-400 text-sm mt-1'>Check that your Odds API key is valid.</p>
      </div>
    );
  }

  const games = data?.games ?? [];

  return (
    <div>
      {dataUpdatedAt > 0 && (
        <p className='text-xs text-gray-500 mb-4'>
          Last updated: {new Date(dataUpdatedAt).toLocaleTimeString()} · Auto-refreshes every 5 min
        </p>
      )}

      {games.length === 0 ? (
        <div className='bg-[#0d1b2a] rounded-xl border border-gray-700 p-10 text-center'>
          <p className='text-gray-400 text-lg'>No NBA games scheduled tonight.</p>
          <p className='text-gray-500 text-sm mt-2'>
            Check back when the NBA season is active.
          </p>
        </div>
      ) : (
        <div className='space-y-4'>
          {[...games]
            .sort((a, b) => b.signals.sharpScore - a.signals.sharpScore)
            .map((game) => (
              <FadeGameCard
                key={game.gameId}
                homeTeam={game.homeTeam}
                awayTeam={game.awayTeam}
                scheduledAt={game.scheduledAt}
                narrative={game.narrative}
                lineMovementCount={game.lineMovementCount}
                signals={game.signals}
              />
            ))}
        </div>
      )}
    </div>
  );
}