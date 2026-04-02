import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

import { inngest } from '../client';
import { db } from '@/lib/db/client';
import { games, odds } from '@/lib/db/schema';

const ODDS_API_KEY = process.env.ODDS_API_KEY!;
const BASE_URL = 'https://api.the-odds-api.com/v4';

export const fetchOddsJob = inngest.createFunction(
  { id: 'fetch-nba-odds', name: 'Fetch NBA Odds', triggers: [{ cron: '*/15 * * * *' }] },
  async ({ step }) => {
    const gamesOdds = await step.run('fetch-game-odds', async () => {
      const url = `${BASE_URL}/sports/basketball_nba/odds?regions=us&markets=h2h,spreads,totals&oddsFormat=american&apiKey=${ODDS_API_KEY}`;
      const res = await fetch(url);
      const text = await res.text();
      if (!res.ok) throw new Error(`Odds API error: ${res.status} - ${text}`);
      return JSON.parse(text);
    });

    await step.run('store-odds', async () => {
      for (const game of gamesOdds) {
        const homeTeam = game.home_team.substring(0, 3).toUpperCase();
        const awayTeam = game.away_team.substring(0, 3).toUpperCase();

        const result = await db.insert(games).values({
          gameDate: new Date(game.commence_time),
          homeTeam,
          awayTeam,
          status: 'scheduled',
        }).onConflictDoNothing().returning({ id: games.id });

        let gameId = result[0]?.id;

        if (!gameId) {
          const existing = await db.query.games.findFirst({
            where: (g, { and, eq }) => and(
              eq(g.homeTeam, homeTeam),
              eq(g.awayTeam, awayTeam)
            )
          });
          gameId = existing?.id;
        }

        if (!gameId) continue;

        for (const bookmaker of game.bookmakers ?? []) {
          for (const market of bookmaker.markets ?? []) {
            for (const outcome of market.outcomes ?? []) {
              try {
                await db.insert(odds).values({
                  gameId,
                  market: market.key,
                  selection: outcome.name,
                  price: String(outcome.price),
                  bookmaker: bookmaker.key,
                });
              } catch {
                // Skip duplicate odds rows
              }
            }
          }
        }
      }
    });
  }
);