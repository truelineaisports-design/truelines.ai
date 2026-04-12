// inngest/fade-polling.ts
import { inngest } from './client';
import {
  fetchCurrentNBAOdds,
  processOddsEvent,
  markSteamMoves,
} from '@/lib/odds-polling';
import { db } from '@/lib/db/client';
import { games } from '@/lib/db/schema';
import { and, gte, lte, eq } from 'drizzle-orm';

export const pollOddsStandard = inngest.createFunction(
  {
    id: 'odds-poll-standard',
    name: 'Poll NBA Odds (Standard — every 10 min)',
    retries: 3,
    triggers: [{ cron: '*/10 * * * *' }],
  },
  async ({ step }: { step: any }) => {
    const events = await step.run('fetch-odds', async () => {
      return await fetchCurrentNBAOdds();
    });

    if (events.length === 0) {
      console.log('[Polling] No NBA games found — nothing to process');
      return { processed: 0 };
    }

    let processed = 0;
    for (const event of events) {
      await step.run(`process-game-${event.id}`, async () => {
        await processOddsEvent(event);
        await markSteamMoves(event.id);
        processed++;
      });
    }

    const pregameGames = await step.run('check-pregame', async () => {
      const now = new Date();
      const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);
      return await db
        .select({ id: games.id, gameDate: games.gameDate })
        .from(games)
        .where(
          and(
            gte(games.gameDate, now),
            lte(games.gameDate, twoHoursFromNow),
            eq(games.status, 'scheduled')
          )
        );
    });

    if (pregameGames.length > 0) {
      await step.sendEvent('trigger-pregame-poll', {
        name: 'odds/pregame-window-active',
        data: { gameCount: pregameGames.length, triggeredAt: new Date().toISOString() },
      });
      console.log(`[Polling] ${pregameGames.length} games in pre-game window`);
    }

    return { processed, pregameWindowActive: pregameGames.length > 0 };
  }
);

export const pollOddsPregame = inngest.createFunction(
  {
    id: 'odds-poll-pregame',
    name: 'Poll NBA Odds (Pre-game — every 3 min)',
    retries: 2,
    concurrency: { limit: 1 },
    triggers: [{ event: 'odds/pregame-window-active' }],
  },
  async ({ step }: { step: any }) => {
    const MAX_ITERATIONS = 40;

    for (let i = 0; i < MAX_ITERATIONS; i++) {
      await step.run(`pregame-poll-${i}`, async () => {
        const events = await fetchCurrentNBAOdds();
        for (const ev of events) {
          await processOddsEvent(ev);
          await markSteamMoves(ev.id);
        }
        console.log(`[Pre-game Poll] Iteration ${i + 1}/${MAX_ITERATIONS}`);
      });

      if (i < MAX_ITERATIONS - 1) {
        await step.sleep(`wait-${i}`, '3m');
      }
    }

    return { message: 'Pre-game polling complete', iterations: MAX_ITERATIONS };
  }
);