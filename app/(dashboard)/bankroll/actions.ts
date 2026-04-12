'use server';

import { db } from '@/lib/db/client';
import { userBankrolls, betOutcomes, users } from '@/lib/db/schema';
import { auth } from '@clerk/nextjs/server';
import { eq, desc } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

// Helper to get the database user from Clerk ID
async function getDbUser() {
  const { userId: clerkId } = await auth();
  if (!clerkId) return null;
  const [user] = await db.select().from(users).where(eq(users.clerkId, clerkId));
  return user ?? null;
}

// CREATE — Set up a new bankroll for the user
export async function createBankroll(
  startingAmount: number,
  riskTier: 'conservative' | 'standard' | 'aggressive'
) {
  const user = await getDbUser();
  if (!user) return { success: false, message: 'Not authenticated' };

  const kellyMap = { conservative: '0.250', standard: '0.500', aggressive: '1.000' };

  try {
    const [bankroll] = await db.insert(userBankrolls).values({
      userId: user.id,
      bankrollAmount: startingAmount.toString(),
      initialBankroll: startingAmount.toString(),
      peakBankroll: startingAmount.toString(),
      riskTier,
      kellyFraction: kellyMap[riskTier],
    }).returning();

    revalidatePath('/bankroll');
    return { success: true, data: bankroll };
  } catch {
    return { success: false, message: 'Failed to create bankroll' };
  }
}

// READ — Get the current user's bankroll
export async function getBankroll() {
  const user = await getDbUser();
  if (!user) return null;

  const [bankroll] = await db.select().from(userBankrolls)
    .where(eq(userBankrolls.userId, user.id))
    .limit(1);

  return bankroll ?? null;
}

// UPDATE — Change risk tier
export async function updateRiskTier(
  riskTier: 'conservative' | 'standard' | 'aggressive'
) {
  const user = await getDbUser();
  if (!user) return { success: false, message: 'Not authenticated' };

  const kellyMap = { conservative: '0.250', standard: '0.500', aggressive: '1.000' };

  const [updated] = await db.update(userBankrolls)
    .set({
      riskTier,
      kellyFraction: kellyMap[riskTier],
      updatedAt: new Date(),
    })
    .where(eq(userBankrolls.userId, user.id))
    .returning();

  revalidatePath('/bankroll');
  return { success: true, data: updated };
}

// LOG BET — Save a bet and deduct stake from bankroll
export async function logBet(input: {
  parlayId: string;
  stakeAmount: number;
  potentialPayout: number;
  kellyStakePct: number;
  oddsAtPlacement: number;
  sportsbook: string;
}) {
  const user = await getDbUser();
  if (!user) return { success: false, message: 'Not authenticated' };

  const [bankroll] = await db.select().from(userBankrolls)
    .where(eq(userBankrolls.userId, user.id));
  if (!bankroll) return { success: false, message: 'No bankroll found. Please set up your bankroll first.' };

  const currentBalance = parseFloat(bankroll.bankrollAmount);
  if (input.stakeAmount > currentBalance) {
    return { success: false, message: 'Stake exceeds current bankroll balance.' };
  }

  try {
    await db.insert(betOutcomes).values({
      userId: user.id,
      parlayId: input.parlayId,
      bankrollId: bankroll.id,
      betType: 'parlay',
      stakeAmount: input.stakeAmount.toString(),
      potentialPayout: input.potentialPayout.toString(),
      kellyStakePct: input.kellyStakePct.toString(),
      oddsAtPlacement: input.oddsAtPlacement.toString(),
      sportsbook: input.sportsbook,
      outcome: 'pending',
    });

    const newBalance = currentBalance - input.stakeAmount;
    const newWagered = parseFloat(bankroll.totalWagered) + input.stakeAmount;

    await db.update(userBankrolls).set({
      bankrollAmount: newBalance.toString(),
      totalWagered: newWagered.toString(),
      updatedAt: new Date(),
    }).where(eq(userBankrolls.id, bankroll.id));

    revalidatePath('/bankroll');
    return { success: true, message: 'Bet logged successfully' };
  } catch {
    return { success: false, message: 'Failed to log bet' };
  }
}

// GET BET HISTORY — Last 20 bets
export async function getBetHistory() {
  const user = await getDbUser();
  if (!user) return [];

  return await db.select().from(betOutcomes)
    .where(eq(betOutcomes.userId, user.id))
    .orderBy(desc(betOutcomes.placedAt))
    .limit(20);
}