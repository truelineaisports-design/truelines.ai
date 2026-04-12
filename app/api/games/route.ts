// app/api/games/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { games } from '@/lib/db/schema';
import { and, gte, lte } from 'drizzle-orm';

export async function GET() {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const todaysGames = await db
      .select()
      .from(games)
      .where(and(gte(games.gameDate, startOfDay), lte(games.gameDate, endOfDay)))
      .orderBy(games.gameDate);

    return NextResponse.json({ games: todaysGames });
  } catch (error) {
    console.error('[Games API] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch games' }, { status: 500 });
  }
}