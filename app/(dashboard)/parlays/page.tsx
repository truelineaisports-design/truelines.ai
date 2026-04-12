import { db } from '@/lib/db/client';
import { parlays, parlayLegs } from '@/lib/db/schema';
import { desc } from 'drizzle-orm';
import ParlayCard from '@/components/ParlayCard';
import GenerateButton from '@/components/GenerateButton';

export default async function ParlaysPage() {
  const todaysParlays = await db.select().from(parlays)
    .orderBy(desc(parlays.createdAt))
    .limit(10);

  const allLegs = todaysParlays.length > 0
    ? await db.select().from(parlayLegs)
    : [];

  const parlaysWithLegs = todaysParlays.map(parlay => ({
    ...parlay,
    legs: allLegs.filter(leg => leg.parlayId === parlay.id),
  }));

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-white">Tonight's Parlays</h1>
        <GenerateButton />
      </div>

      {parlaysWithLegs.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-xl mb-4">No parlays generated yet for today.</p>
          <p>Click "Generate Parlays" to get tonight's picks.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {parlaysWithLegs.map((parlay, index) => (
            <ParlayCard
              key={parlay.id}
              parlay={parlay}
              isPro={true}
              rank={index + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}