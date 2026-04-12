// src/lib/odds-polling.ts
import { db } from '@/lib/db/client';
import { odds, lineMovements, games } from '@/lib/db/schema';
import { eq, and, gte, sql } from 'drizzle-orm';

const BOOKMAKERS = [
  'pinnacle',
  'draftkings',
  'fanduel',
  'betmgm',
  'caesars',
  'pointsbet',
].join(',');

interface OddsApiOutcome {
  name: string;
  price: number;
  point?: number;
}

interface OddsApiMarket {
  key: string;
  outcomes: OddsApiOutcome[];
  last_update: string;
}

interface OddsApiBookmaker {
  key: string;
  title: string;
  markets: OddsApiMarket[];
}

interface OddsApiEvent {
  id: string;
  sport_key: string;
  sport_title: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  bookmakers: OddsApiBookmaker[];
}

export async function fetchCurrentNBAOdds(): Promise<OddsApiEvent[]> {
  const apiKey = process.env.ODDS_API_KEY;
  if (!apiKey) throw new Error('ODDS_API_KEY is not set in .env.local');

  const url = new URL('https://api.the-odds-api.com/v4/sports/basketball_nba/odds');
  url.searchParams.set('apiKey', apiKey);
  url.searchParams.set('regions', 'us,eu');
  url.searchParams.set('markets', 'spreads,totals');
  url.searchParams.set('oddsFormat', 'american');
  url.searchParams.set('bookmakers', BOOKMAKERS);

  const response = await fetch(url.toString(), {
    cache: 'no-store',
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Odds API error ${response.status}: ${text}`);
  }

  const data = await response.json();
  console.log(`[OddsAPI] Fetched ${data.length} NBA games`);
  return data as OddsApiEvent[];
}

export async function processOddsEvent(event: OddsApiEvent): Promise<void> {
  const capturedAt = new Date();

  const [game] = await db
    .select({ id: games.id })
    .from(games)
    .where(eq(games.id, event.id))
    .limit(1);

  if (!game) {
    console.log(`[OddsAPI] Game not found in DB: ${event.id} — skipping`);
    return;
  }

  for (const bookmaker of event.bookmakers) {
    for (const market of bookmaker.markets) {
      if (!['spreads', 'totals'].includes(market.key)) continue;

      for (const outcome of market.outcomes) {
        const currentLine = outcome.point ?? null;
        const currentOdds = outcome.price;

        await db.insert(odds).values({
          gameId: game.id,
          market: market.key,
          selection: outcome.name,
          price: currentOdds.toString(),
          bookmaker: bookmaker.key,
          updatedAt: capturedAt,
        }).onConflictDoNothing();

        const tenMinutesAgo = new Date(capturedAt.getTime() - 10 * 60 * 1000);

        const [prevSnapshot] = await db
          .select()
          .from(odds)
          .where(
            and(
              eq(odds.gameId, game.id),
              eq(odds.bookmaker, bookmaker.key),
              eq(odds.market, market.key),
              eq(odds.selection, outcome.name),
              gte(odds.updatedAt, tenMinutesAgo)
            )
          )
          .orderBy(sql`updated_at ASC`)
          .limit(1);

        if (prevSnapshot && currentLine !== null) {
          const prevPrice = parseFloat(prevSnapshot.price);
          if (prevPrice !== currentOdds) {
            await db.insert(lineMovements).values({
              gameId: game.id,
              market: market.key,
              oldPrice: prevPrice.toString(),
              newPrice: currentOdds.toString(),
              movedAt: capturedAt,
            }).onConflictDoNothing();
          }
        }
      }
    }
  }
}

export async function markSteamMoves(gameId: string): Promise<void> {
  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);

  const recentMoves = await db
    .select()
    .from(lineMovements)
    .where(
      and(
        eq(lineMovements.gameId, gameId),
        gte(lineMovements.movedAt, tenMinutesAgo)
      )
    );

  if (recentMoves.length < 3) return;

  const upMovers = recentMoves.filter(
    (m) => parseFloat(m.newPrice) > parseFloat(m.oldPrice)
  );
  const downMovers = recentMoves.filter(
    (m) => parseFloat(m.newPrice) < parseFloat(m.oldPrice)
  );

  if (upMovers.length >= 3 || downMovers.length >= 3) {
    console.log(`[Steam] Steam move detected for game ${gameId}`);
  }
}