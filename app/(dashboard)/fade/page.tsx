// app/(dashboard)/fade/page.tsx
import { FadeClient } from '@/components/fade/FadeClient';

export const metadata = {
  title: 'Fade the Public | TrueLineAI',
  description: 'Sharp money signals and line movement analysis for NBA games',
};

export default function FadePage() {
  return (
    <div className='min-h-screen bg-[#070d16] p-4 md:p-8'>
      <div className='max-w-4xl mx-auto'>
        <div className='mb-8'>
          <h1 className='text-3xl font-bold text-white'>
            Fade the <span className='text-[#00e87a]'>Public</span>
          </h1>
          <p className='text-gray-400 mt-2'>
            Track where sharp money is moving versus public consensus.
            Three signals: Reverse Line Movement, Pinnacle Divergence, Steam Moves.
          </p>
        </div>

        <div className='flex gap-4 mb-6 flex-wrap'>
          <div className='flex items-center gap-2'>
            <span className='w-3 h-3 rounded-full bg-[#00e87a] inline-block'></span>
            <span className='text-xs text-gray-400'>Steam Move (strongest)</span>
          </div>
          <div className='flex items-center gap-2'>
            <span className='w-3 h-3 rounded-full bg-blue-500 inline-block'></span>
            <span className='text-xs text-gray-400'>Reverse Line Movement</span>
          </div>
          <div className='flex items-center gap-2'>
            <span className='w-3 h-3 rounded-full bg-purple-500 inline-block'></span>
            <span className='text-xs text-gray-400'>Pinnacle Divergence</span>
          </div>
        </div>

        <FadeClient />
      </div>
    </div>
  );
}