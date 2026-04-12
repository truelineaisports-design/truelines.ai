// components/fade/FadeGameCard.tsx
'use client';

import { SharpMeter } from './SharpMeter';
import { format } from 'date-fns';

interface FadeGameCardProps {
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

export function FadeGameCard({
  homeTeam,
  awayTeam,
  scheduledAt,
  narrative,
  lineMovementCount,
  signals,
}: FadeGameCardProps) {
  const tipOffTime = format(new Date(scheduledAt), 'h:mm a');

  const borderColor =
    signals.sharpScore === 3
      ? 'border-[#00e87a]'
      : signals.sharpScore === 2
      ? 'border-[#00b85e]'
      : signals.sharpScore === 1
      ? 'border-amber-500'
      : 'border-gray-700';

  return (
    <div className={`bg-[#0d1b2a] rounded-xl border ${borderColor} p-5 transition-all hover:border-opacity-80`}>
      {/* Header: Teams + Time */}
      <div className='flex items-center justify-between mb-4'>
        <div className='flex items-center gap-3'>
          <div className='text-center'>
            <p className='text-xs text-gray-400'>AWAY</p>
            <p className='font-bold text-white text-lg'>{awayTeam}</p>
          </div>
          <div className='text-gray-500 text-sm font-bold'>@</div>
          <div className='text-center'>
            <p className='text-xs text-gray-400'>HOME</p>
            <p className='font-bold text-white text-lg'>{homeTeam}</p>
          </div>
        </div>
        <div className='text-right'>
          <p className='text-xs text-gray-400'>TIP-OFF</p>
          <p className='text-white font-semibold'>{tipOffTime}</p>
          <p className='text-xs text-gray-500'>{lineMovementCount} movements</p>
        </div>
      </div>

      {/* Sharp Meter */}
      <SharpMeter
        sharpScore={signals.sharpScore}
        publicBetPct={null}
        hasSteamMove={signals.hasSteamMove}
        hasRLM={signals.hasRLM}
        hasPinnacleDiv={signals.hasPinnacleDiv}
      />

      {/* AI Narrative */}
      <div className='mt-4 p-3 bg-[#0A1628] rounded-lg border border-gray-700'>
        <p className='text-xs text-[#00e87a] font-semibold mb-1'>AI ANALYSIS</p>
        <p className='text-sm text-gray-300 leading-relaxed'>{narrative}</p>
      </div>

      {/* Signal details */}
      {(signals.hasPinnacleDiv || signals.hasRLM || signals.hasSteamMove) && (
        <div className='mt-3 space-y-1'>
          {signals.hasPinnacleDiv && (
            <p className='text-xs text-gray-400'>
              <span className='text-purple-400 font-semibold'>Pinnacle:</span>{' '}
              {signals.pinnacleGap.toFixed(1)} pt divergence from retail avg
            </p>
          )}
          {signals.hasRLM && (
            <p className='text-xs text-gray-400'>
              <span className='text-blue-400 font-semibold'>RLM:</span>{' '}
              {signals.rlmDirection.replace(/_/g, ' ')}
            </p>
          )}
          {signals.hasSteamMove && (
            <p className='text-xs text-gray-400'>
              <span className='text-[#00e87a] font-semibold'>Steam:</span>{' '}
              {signals.steamBookmakers.slice(0, 3).join(', ')}
            </p>
          )}
        </div>
      )}
    </div>
  );
}