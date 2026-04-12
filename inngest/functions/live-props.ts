import { inngest } from '../client'
import { Redis } from '@upstash/redis'
import Anthropic from '@anthropic-ai/sdk'
import { projectPlayer, getRemainingMinutes, isBlowout } from '@/lib/projections'
import type { LiveGame, LivePlayer } from '@/lib/projections'

const redis = Redis.fromEnv()
const anthropic = new Anthropic()
const NBA_SERVICE = process.env.NBA_SERVICE_URL!
const ODDS_API_KEY = process.env.ODDS_API_KEY!

const THRESHOLD = 0.20

export const pollLiveGames = inngest.createFunction(
  {
    id: 'poll-live-games',
    name: 'Poll Live NBA Games',
    triggers: [{ cron: '* * * * *' }],
    concurrency: { limit: 1 },
  },
  async ({ step }) => {
    const hour = parseInt(
      new Date().toLocaleString('en-US', {
        timeZone: 'America/New_York',
        hour: 'numeric',
        hour12: false,
      })
    )
    if (hour >= 1 && hour < 19) {
      return { skipped: true, reason: 'Outside game hours' }
    }

    const liveGames = await step.run('fetch-live-games', async () => {
      const res = await fetch(`${NBA_SERVICE}/scoreboard`)
      if (!res.ok) throw new Error('NBA service unavailable')
      const data = await res.json() as { games: LiveGame[] }
      return data.games.filter((g: LiveGame) => g.gameStatus === 2)
    })

    if (liveGames.length === 0) {
      return { processed: 0, reason: 'No live games' }
    }

    await step.sendEvent('fan-out-games',
      liveGames.map((game: LiveGame) => ({
        name: 'game/process-live',
        data: { game },
      }))
    )

    return { processed: liveGames.length }
  }
)

export const processLiveGame = inngest.createFunction(
  {
    id: 'process-live-game',
    name: 'Process Live Game Props',
    triggers: [{ event: 'game/process-live' }],
  },
  async ({ event, step }) => {
    const game = event.data.game as LiveGame

    if (isBlowout(game)) {
      await redis.set(
        `live:${game.gameId}`,
        JSON.stringify({ blowout: true, game }),
        { ex: 120 }
      )
      return { skipped: true, reason: 'Blowout detected' }
    }

    const players = await step.run('fetch-boxscore', async () => {
      const res = await fetch(`${NBA_SERVICE}/boxscore/${game.gameId}`)
      if (!res.ok) throw new Error('Boxscore fetch failed')
      const data = await res.json() as { players: LivePlayer[] }
      return data.players
    })

    const propLines = await step.run('fetch-prop-lines', async () => {
      try {
        const eventsRes = await fetch(
          `https://api.the-odds-api.com/v4/sports/basketball_nba/events?apiKey=${ODDS_API_KEY}`
        )
        const eventsData = await eventsRes.json() as Array<{
          id: string; home_team: string; away_team: string
        }>

        const matchedEvent = eventsData.find(
          (e) => e.home_team.includes(game.homeTeam) ||
               e.away_team.includes(game.awayTeam)
        )
        if (!matchedEvent) return {}

        const oddsRes = await fetch(
          `https://api.the-odds-api.com/v4/sports/basketball_nba/events/${matchedEvent.id}/odds` +
          `?apiKey=${ODDS_API_KEY}&regions=us&markets=player_points,player_rebounds,player_assists`
        )
        const oddsData = await oddsRes.json() as {
          bookmakers?: Array<{
            markets: Array<{
              key: string;
              outcomes: Array<{ name: string; description: string; price: number; point: number }>
            }>
          }>
        }

        const lines: Record<string, number> = {}
        const bk = oddsData.bookmakers?.[0]
        if (bk) {
          for (const market of bk.markets) {
            const statType = market.key.replace('player_', '')
            for (const outcome of market.outcomes) {
              if (outcome.name === 'Over') {
                const key = `${outcome.description}_${statType}`
                lines[key] = outcome.point
              }
            }
          }
        }
        return lines
      } catch {
        return {}
      }
    })

    const remainingMinutes = getRemainingMinutes(game.period, game.gameClock)
    const suggestions: object[] = []

    for (const player of players as LivePlayer[]) {
      if (!player.onCourt && remainingMinutes > 4) continue

      const projection = projectPlayer(player, remainingMinutes)
      if (projection.confidence === 'low') continue

      const checks = [
        { stat: 'points',   projected: projection.projectedPoints },
        { stat: 'rebounds', projected: projection.projectedRebounds },
        { stat: 'assists',  projected: projection.projectedAssists },
      ]

      for (const { stat, projected } of checks) {
        const lineKey = `${player.name}_${stat}`
        const propLine = (propLines as Record<string, number>)[lineKey]
        if (!propLine) continue

        const deviation = (projected - propLine) / propLine
        if (Math.abs(deviation) < THRESHOLD) continue

        const direction = deviation > 0 ? 'OVER' : 'UNDER'
        const explanation = await getHaikuExplanation(
          player.name, stat, projected, propLine, direction, game
        )

        suggestions.push({
          player: player.name,
          team: player.team,
          stat,
          propLine,
          projected: Math.round(projected * 10) / 10,
          direction,
          deviationPct: Math.round(Math.abs(deviation) * 100),
          explanation,
          confidence: projection.confidence,
          minutesPlayed: player.minutesPlayed,
        })
      }
    }

    const cacheData = {
      game,
      suggestions,
      generatedAt: Date.now(),
      remainingMinutes,
    }
    await redis.set(`live:${game.gameId}`, JSON.stringify(cacheData), { ex: 30 })

    return { gameId: game.gameId, suggestions: suggestions.length }
  }
)

async function getHaikuExplanation(
  playerName: string,
  stat: string,
  projected: number,
  propLine: number,
  direction: string,
  game: LiveGame
): Promise<string> {
  try {
    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 150,
      system: [{ 
        type: 'text' as const, 
        text: 'You are a sports betting analyst. Given live game data, write exactly 2 sentences explaining why a player prop bet is valuable. Be specific with numbers. No disclaimers.',
        cache_control: { type: 'ephemeral' } 
      }] as any,
      messages: [{
        role: 'user',
        content: `Player: ${playerName} | Stat: ${stat} | Prop line: ${propLine} | ` +
          `Projected final: ${projected} | Direction: ${direction} | ` +
          `Game: ${game.awayTeam} at ${game.homeTeam} | ` +
          `Period: Q${game.period} | Score: ${game.awayScore}-${game.homeScore}`,
      }],
    })
    const content = message.content[0]
    return content.type === 'text' ? content.text : ''
  } catch {
    return `${playerName} is on pace for ${projected} ${stat} vs a line of ${propLine}.`
  }
}