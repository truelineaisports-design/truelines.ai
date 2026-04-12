// app/api/fade/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db/client';
import { games, odds, lineMovements } from '@/lib/db/schema';
import { and, eq, gte, lte, desc } from 'drizzle-orm';
import {
  calculateSharpSignals,
  OddsSnapshot,
  LineMovementRecord,
} from '@/lib/sharp-signals';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

async function generateSharpNarrative(
  homeTeam: string,
  awayTeam: string,
  signalSummary: string,
  sharpScore: number
): Promise<string> {
  if (sharpScore === 0) {
    return 'No significant sharp money signals detected for this game.';
  }

  try {
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 120,
      system:
        'You are a sharp sports betting analyst. Write one concise sentence (max 30 words) ' +
        'explaining what the sharp money signals mean for this NBA game. Be direct. No fluff. ' +
        'Do not use the word "significant". Do not recommend placing a bet.',
      messages: [
        {
          role: 'user',
          content:
            `Game: ${awayTeam} at ${homeTeam}. ` +
            `Sharp signals detected (${sharpScore}/3): ${signalSummary}. ` +
            `Write the one-sentence explanation.`,
        },
      ],
    });

    const content = response.content[0];
    return content.type === 'text' ? content.text : 'Sharp money detected on this game.';
  } catch (err) {
    console.error('[Haiku] Narrative generation failed:', err);
    return `Sharp signals: ${signalSummary}`;
  }
}

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
const now = new Date();
const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);
const fortyEightHoursAhead = new Date(now.getTime() + 48 * 60 * 60 * 1000);

const tonightGames = await db
  .select()
  .from(games)
  .where(
    and(
      gte(games.gameDate, fortyEightHoursAgo),
      lte(games.gameDate, fortyEightHoursAhead)
    )
  )
  .orderBy(games.gameDate);

    if (tonightGames.length === 0) {
      return NextResponse.json({ games: [], message: 'No NBA games scheduled tonight' });
    }

    const results = await Promise.all(
      tonightGames.map(async (game) => {
        const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);

        const oddsSnapshots = await db
          .select()
          .from(odds)
          .where(
            and(
              eq(odds.gameId, game.id),
              eq(odds.market, 'spreads'),
              gte(odds.updatedAt, tenMinutesAgo)
            )
          );

        const recentMovements = await db
          .select()
          .from(lineMovements)
          .where(
            and(
              eq(lineMovements.gameId, game.id),
              gte(lineMovements.movedAt, tenMinutesAgo)
            )
          )
          .orderBy(desc(lineMovements.movedAt));

        const typedSnapshots: OddsSnapshot[] = oddsSnapshots.map((o) => ({
          bookmaker: o.bookmaker ?? '',
point: null as number | null,        
  price: parseFloat(o.price),
          captured_at: o.updatedAt ?? new Date(),
        }));

        const typedMovements: LineMovementRecord[] = recentMovements.map((m) => ({
          bookmaker: '',
          market_type: m.market,
          previous_line: parseFloat(m.oldPrice),
          current_line: parseFloat(m.newPrice),
          movement_pct: null,
          captured_at: m.movedAt ?? new Date(),
        }));

        const signals = calculateSharpSignals(
          typedSnapshots,
          typedMovements,
          null,
          null,
          null,
          'spreads'
        );

        const narrative = await generateSharpNarrative(
          game.homeTeam,
          game.awayTeam,
          signals.signalSummary,
          signals.sharpScore
        );

        return {
          gameId: game.id,
          homeTeam: game.homeTeam,
          awayTeam: game.awayTeam,
          scheduledAt: game.gameDate,
          signals,
          narrative,
          lineMovementCount: recentMovements.length,
        };
      })
    );

    return NextResponse.json({ games: results });
  } catch (err) {
    console.error('[Fade API] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}