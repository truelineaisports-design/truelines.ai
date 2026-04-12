import { inngest } from './client';
import { db } from '@/lib/db/client';
import Anthropic from '@anthropic-ai/sdk';
import { games, players, playerStats, odds, injuries, parlays, parlayLegs, generations } from '@/lib/db/schema';
import { eq, and, gte, lte, desc } from 'drizzle-orm';

const anthropic = new Anthropic();

const PARLAY_SYSTEM_PROMPT = `You are an expert NBA sports betting analyst generating data-backed parlay suggestions.

Your task: Analyze the provided NBA game data and generate EXACTLY 3 parlay suggestions. No more, no less.

CRITICAL OUTPUT RULES:
- Respond ONLY with valid JSON. No prose, no markdown, no explanation outside the JSON.
- Do not invent players, games, or statistics not present in the provided data.
- All player names and team abbreviations must exactly match the data provided to you.
- NEVER include players listed as OUT, DOUBTFUL, or QUESTIONABLE in any parlay leg. Only use healthy, confirmed-active players.

OUTPUT FORMAT (return exactly this JSON structure):
{
  "parlays": [
    {
      "confidence": "high" | "medium" | "low",
      "combined_odds": -110,
      "rationale": "Brief 1 sentence explanation of why these legs make sense together",
      "legs": [
        {
          "game_id": "the exact game UUID from the data",
          "player_id": "the exact player UUID, or null for team bets",
          "bet_type": "spread" | "moneyline" | "total" | "player_prop",
          "prop_type": "points" | "rebounds" | "assists" | null,
          "selection": "Human readable: e.g. Lakers -4.5 or LeBron Over 25.5 pts",
          "line": 25.5,
          "odds": -110,
          "implied_probability": 0.5238,
          "model_probability": 0.5800
        }
      ]
    }
  ]
}

PARLAY RULES:
- Each parlay must have 2-4 legs
- Do not create parlays where legs directly conflict
- The first parlay should be the highest-confidence pick
- The third parlay should be the highest-risk / highest-reward pick
- Use player props when strong statistical edges are present
- Keep rationale to 1 sentence maximum
- Keep each selection label under 10 words`;

function calculateCost(model: string, inputTokens: number, outputTokens: number, cachedTokens: number): number {
  if (model.includes('haiku')) {
    return (inputTokens / 1_000_000) * 1.00 + (outputTokens / 1_000_000) * 5.00 + (cachedTokens / 1_000_000) * 0.10;
  } else {
    return (inputTokens / 1_000_000) * 3.00 + (outputTokens / 1_000_000) * 15.00 + (cachedTokens / 1_000_000) * 0.30;
  }
}

export const generateParlays = inngest.createFunction(
  {
    id: 'generate-parlays',
    name: 'Generate NBA Parlays',
    retries: 2,
    triggers: [{ event: 'trueline/generate.parlays' }],
  },
  async ({ event, step }) => {
    const { slateDate, userId } = event.data as { slateDate: string; userId?: string };
    const modelCalls: object[] = [];
    let totalCost = 0;
    const startTime = Date.now();

    const tonightGames = await step.run('fetch-tonight-games', async () => {
      const now = new Date();
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      const result = await db.select().from(games).where(
        and(
          gte(games.gameDate, now),
          lte(games.gameDate, tomorrow),
          eq(games.status, 'scheduled')
        )
      );

      if (result.length === 0) {
        throw new Error(`No scheduled games found in the next 24 hours`);
      }

      return result;
    });

    const contextData = await step.run('gather-context-data', async () => {
      const activeTeams = [...new Set(tonightGames.flatMap(g => [g.homeTeam, g.awayTeam]))];

      const allOdds = await db.select().from(odds).where(
        gte(odds.updatedAt, new Date(Date.now() - 24 * 60 * 60 * 1000))
      ).limit(200);

      const activePlayers = await db.select().from(players).where(eq(players.isActive, true));
      const relevantPlayers = activePlayers.filter(p =>
        activeTeams.includes(p.teamAbbr ?? '') || activeTeams.includes(p.team ?? '')
      );

      const recentStats = await db.select({
        playerId: playerStats.playerId,
        points: playerStats.points,
        rebounds: playerStats.rebounds,
        assists: playerStats.assists,
        minutesPlayed: playerStats.minutesPlayed,
        createdAt: playerStats.createdAt,
      }).from(playerStats)
        .orderBy(desc(playerStats.createdAt))
        .limit(100);

      const activeInjuries = await db.select({
        playerId: injuries.playerId,
        status: injuries.status,
        description: injuries.description,
        updatedAt: injuries.updatedAt,
      }).from(injuries).orderBy(desc(injuries.updatedAt)).limit(50);

      return { games: tonightGames, odds: allOdds, players: relevantPlayers, recentStats, injuries: activeInjuries };
    });

    const compressedContext = await step.run('haiku-compression', async () => {
      const avg = (arr: (number | null)[]) => arr.reduce((s: number, v) => s + (v || 0), 0) / Math.max(arr.length, 1);

      const injuredPlayerIds = new Set(contextData.injuries
        .filter(i => ['out', 'doubtful', 'questionable'].includes(i.status.toLowerCase()))
        .map(i => i.playerId)
      );

      const summary = {
        games: contextData.games.map(g => ({
          id: g.id,
          home: g.homeTeam,
          away: g.awayTeam,
        })),
        players: contextData.players
          .filter(p => !injuredPlayerIds.has(p.id))
          .slice(0, 20).map(p => {
            const stats = contextData.recentStats.filter(s => s.playerId === p.id).slice(0, 5);
            return {
              id: p.id,
              name: p.fullName,
              team: p.teamAbbr ?? p.team ?? '',
              avgPts: Math.round(avg(stats.map(s => s.points)) * 10) / 10,
              avgReb: Math.round(avg(stats.map(s => s.rebounds)) * 10) / 10,
              avgAst: Math.round(avg(stats.map(s => s.assists)) * 10) / 10,
            };
          }),
        odds: contextData.odds.slice(0, 20).map(o => ({
          gameId: o.gameId,
          market: o.market ?? o.marketType,
          selection: o.selection ?? o.outcomeName,
          price: o.price,
        })),
      };

      return JSON.stringify(summary);
    });

    const rawParlayOutput = await step.run('sonnet-generation', async () => {
      const sonnet = await anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 1200,
        system: [{ type: 'text', text: PARLAY_SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }] as any,
        messages: [{ role: 'user', content: `Generate exactly 3 NBA parlays for tonights slate. You MUST respond with a raw JSON object only. Do not use markdown. Do not use code fences. Start your response with { and end with }.\n\n${compressedContext}` }],
      });

      const sonnetUsage = sonnet.usage;
      const sonnetCost = calculateCost('sonnet', sonnetUsage.input_tokens, sonnetUsage.output_tokens, (sonnetUsage as any).cache_read_input_tokens || 0);
      modelCalls.push({ call_order: 1, model_id: 'claude-sonnet-4-6', role: 'generation', input_tokens: sonnetUsage.input_tokens, output_tokens: sonnetUsage.output_tokens, cached_tokens: (sonnetUsage as any).cache_read_input_tokens || 0, cost_usd: sonnetCost });
      totalCost += sonnetCost;

      const content = sonnet.content[0];
      if (content.type !== 'text') throw new Error('Sonnet returned unexpected response type');
      return content.text;
    });

    const validatedParlays = await step.run('validate-output', async () => {
      let parsed: any;
      try {
        let cleaned = rawParlayOutput
          .replace(/```json\n?/g, '')
          .replace(/```\n?/g, '')
          .trim();
        const firstBrace = cleaned.indexOf('{');
        const lastBrace = cleaned.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1) {
          cleaned = cleaned.substring(firstBrace, lastBrace + 1);
        }
        parsed = JSON.parse(cleaned);
      } catch (e) {
        throw new Error(`Claude returned invalid JSON: ${rawParlayOutput.substring(0, 200)}`);
      }

      if (!parsed.parlays || !Array.isArray(parsed.parlays)) throw new Error('Missing parlays array');
      if (parsed.parlays.length !== 3) throw new Error(`Expected 3 parlays, got ${parsed.parlays.length}`);

      const validGameIds = new Set(tonightGames.map(g => g.id));
      const validPlayerIds = new Set(contextData.players.map(p => p.id));

      for (let i = 0; i < parsed.parlays.length; i++) {
        const parlay = parsed.parlays[i];
        if (!parlay.legs || parlay.legs.length < 1) throw new Error(`Parlay ${i + 1} needs at least 1 leg`);
        for (let j = 0; j < parlay.legs.length; j++) {
          const leg = parlay.legs[j];
          if (!validGameIds.has(leg.game_id)) throw new Error(`Parlay ${i + 1} Leg ${j + 1}: invalid game_id`);
          if (leg.player_id && !validPlayerIds.has(leg.player_id)) throw new Error(`Parlay ${i + 1} Leg ${j + 1}: invalid player_id`);
          if (!leg.selection || !leg.odds || !leg.bet_type) throw new Error(`Parlay ${i + 1} Leg ${j + 1}: missing required fields`);
        }
      }
      return parsed.parlays;
    });

    const savedParlayIds = await step.run('save-to-database', async () => {
      const slateDateObj = new Date(slateDate);
      const savedIds: string[] = [];

      for (let i = 0; i < validatedParlays.length; i++) {
        const parlayData = validatedParlays[i];
        const [saved] = await db.insert(parlays).values({
          slateDate: slateDateObj,
          confidence: parlayData.confidence || 'medium',
          combinedOdds: String(parlayData.combined_odds || 0),
          rationale: parlayData.rationale || '',
          isFeatured: i === 0,
          outcome: 'pending',
        }).returning({ id: parlays.id });

        for (let j = 0; j < parlayData.legs.length; j++) {
          const leg = parlayData.legs[j];
          await db.insert(parlayLegs).values({
            parlayId: saved.id,
            gameId: leg.game_id,
            playerId: leg.player_id || null,
            betType: leg.bet_type,
            propType: leg.prop_type || null,
            selection: leg.selection,
            line: leg.line ? String(leg.line) : null,
            odds: String(leg.odds),
            impliedProbability: leg.implied_probability ? String(leg.implied_probability) : null,
            modelProbability: leg.model_probability ? String(leg.model_probability) : null,
            outcome: 'pending',
            legOrder: j + 1,
          });
        }
        savedIds.push(saved.id);
      }
      return savedIds;
    });

    await step.run('log-telemetry', async () => {
      const ceilingBreached = totalCost > 0.01;
      if (ceilingBreached) console.error(`[BREACH] $${totalCost.toFixed(6)} — ceiling breached`);
      else if (totalCost > 0.008) console.warn(`[WARNING] $${totalCost.toFixed(6)} — approaching ceiling`);

      await db.insert(generations).values({
        userId: null,
        generationType: 'parlay',
        totalCostUsd: String(totalCost.toFixed(6)),
        ceilingBreached,
        modelCalls: modelCalls as any,
        totalLatencyMs: Date.now() - startTime,
      });
    });

    return { success: true, parlayIds: savedParlayIds, totalCost: totalCost.toFixed(6), slateDate };
  }
);