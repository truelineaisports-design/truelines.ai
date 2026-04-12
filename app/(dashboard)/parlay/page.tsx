import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db/client';
import { parlays, parlayLegs, users, userBankrolls } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import ParlayCard from '@/components/ParlayCard';
import GenerateButton from '@/components/GenerateButton';

export default async function ParlaysPage() {
  const { userId: clerkId } = await auth();
  if (!clerkId) redirect('/sign-in');

let [user] = await db.select().from(users).where(eq(users.clerkId, clerkId));
  if (!user) {
    const [newUser] = await db.insert(users).values({
      clerkId: clerkId,
      email: `${clerkId}@placeholder.com`,
      subscriptionTier: 'free',
    }).onConflictDoUpdate({
      target: users.clerkId,
      set: { updatedAt: new Date() }
    }).returning();
    user = newUser;
  }

  const [bankroll] = await db.select().from(userBankrolls)
    .where(eq(userBankrolls.userId, user.id))
    .limit(1);

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

  const isPro = user.subscriptionTier === 'pro' || user.subscriptionTier === 'sharp';
  const visibleParlays = isPro
    ? parlaysWithLegs
    : parlaysWithLegs.filter(p => p.isFeatured).slice(0, 1);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-white">Tonight's Parlays</h1>
        <GenerateButton />
      </div>

      {visibleParlays.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-xl mb-4">No parlays generated yet for today.</p>
          <p>Click "Generate Parlays" to get tonight's picks.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {visibleParlays.map((parlay, index) => (
            <ParlayCard
              key={parlay.id}
              parlay={parlay}
              isPro={isPro}
              rank={index + 1}
              bankroll={bankroll ?? null}
            />
          ))}
        </div>
      )}

      {!isPro && parlaysWithLegs.length > 1 && (
        <div className="mt-8 p-6 bg-gradient-to-r from-purple-900 to-blue-900 rounded-xl border border-purple-500">
          <p className="text-white font-bold text-lg mb-2">
            {parlaysWithLegs.length - 1} more parlay{parlaysWithLegs.length > 2 ? 's' : ''} available
          </p>
          <p className="text-gray-300 mb-4">Upgrade to Pro to see all 3 nightly parlays with full AI rationale.</p>
          <a href="/pricing" className="bg-purple-500 hover:bg-purple-400 text-white font-bold py-2 px-6 rounded-lg transition-colors">
            Upgrade to Pro — $14.99/mo
          </a>
        </div>
      )}
    </div>
  );
}