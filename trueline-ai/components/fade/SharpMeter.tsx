// components/fade/SharpMeter.tsx
interface SharpMeterProps {
  sharpScore: number;
  publicBetPct: number | null;
  hasSteamMove: boolean;
  hasRLM: boolean;
  hasPinnacleDiv: boolean;
}

export function SharpMeter({
  sharpScore,
  publicBetPct,
  hasSteamMove,
  hasRLM,
  hasPinnacleDiv,
}: SharpMeterProps) {
  const sharpPct = Math.round((sharpScore / 3) * 100);
  const publicPct = 100 - sharpPct;

  const barColor =
    sharpScore === 3
      ? 'bg-[#00e87a]'
      : sharpScore === 2
      ? 'bg-[#00b85e]'
      : sharpScore === 1
      ? 'bg-[#f59e0b]'
      : 'bg-[#6b7280]';

  return (
    <div className='w-full'>
      <div className='flex justify-between text-xs mb-1'>
        <span className='text-gray-400'>Public</span>
        <span className='font-semibold text-[#00e87a]'>Sharp</span>
      </div>

      <div className='h-3 bg-gray-700 rounded-full overflow-hidden flex'>
        <div
          className='h-full bg-gray-500 transition-all duration-500'
          style={{ width: `${publicPct}%` }}
        />
        <div
          className={`h-full ${barColor} transition-all duration-500`}
          style={{ width: `${sharpPct}%` }}
        />
      </div>

      <div className='flex gap-2 mt-2 flex-wrap'>
        {hasSteamMove && (
          <span className='px-2 py-0.5 rounded-full text-xs font-bold bg-[#00e87a] text-black'>
            STEAM
          </span>
        )}
        {hasRLM && (
          <span className='px-2 py-0.5 rounded-full text-xs font-bold bg-blue-500 text-white'>
            RLM
          </span>
        )}
        {hasPinnacleDiv && (
          <span className='px-2 py-0.5 rounded-full text-xs font-bold bg-purple-500 text-white'>
            PINNACLE
          </span>
        )}
        {!hasSteamMove && !hasRLM && !hasPinnacleDiv && (
          <span className='px-2 py-0.5 rounded-full text-xs text-gray-500 bg-gray-800'>
            No signals
          </span>
        )}
      </div>

      {publicBetPct !== null && (
        <p className='text-xs text-gray-500 mt-1'>
          {publicBetPct.toFixed(0)}% of public tickets on favorite
        </p>
      )}
    </div>
  );
}