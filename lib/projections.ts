export interface LivePlayer {
  playerId: string
  name: string
  team: string
  minutesPlayed: number
  points: number
  rebounds: number
  assists: number
  foulsPersonal: number
  onCourt: boolean
}

export interface LiveGame {
  gameId: string
  homeTeam: string
  awayTeam: string
  homeScore: number
  awayScore: number
  period: number
  gameClock: string
  gameStatus: number
}

export interface PlayerProjection {
  player: LivePlayer
  projectedPoints: number
  projectedRebounds: number
  projectedAssists: number
  remainingMinutes: number
  confidence: 'high' | 'medium' | 'low'
}

export function parseClock(clockStr: string): number {
  if (!clockStr) return 0
  const match = clockStr.match(/PT(\d+)M([\d.]+)S/)
  if (!match) return 0
  return parseInt(match[1]) + parseFloat(match[2]) / 60
}

export function getRemainingMinutes(period: number, clockStr: string): number {
  const clockMinutes = parseClock(clockStr)
  if (period <= 0) return 48
  if (period <= 4) {
    return (4 - period) * 12 + clockMinutes
  }
  return clockMinutes
}

export function isBlowout(game: LiveGame): boolean {
  if (game.period < 4) return false
  const diff = Math.abs(game.homeScore - game.awayScore)
  const remaining = getRemainingMinutes(game.period, game.gameClock)
  return diff >= 15 && remaining <= 8
}

export function projectPlayer(
  player: LivePlayer,
  remainingMinutes: number
): PlayerProjection {
  const { minutesPlayed, points, rebounds, assists, foulsPersonal } = player

  if (minutesPlayed < 3) {
    return {
      player,
      projectedPoints: points,
      projectedRebounds: rebounds,
      projectedAssists: assists,
      remainingMinutes,
      confidence: 'low',
    }
  }

  let effectiveRemaining = remainingMinutes
  if (foulsPersonal >= 4) {
    effectiveRemaining = remainingMinutes * 0.5
  }

  const perMinPoints   = points   / minutesPlayed
  const perMinRebounds = rebounds / minutesPlayed
  const perMinAssists  = assists  / minutesPlayed

  const projectedPoints   = points   + perMinPoints   * effectiveRemaining
  const projectedRebounds = rebounds + perMinRebounds * effectiveRemaining
  const projectedAssists  = assists  + perMinAssists  * effectiveRemaining

  const confidence: 'high' | 'medium' | 'low' =
    minutesPlayed >= 20 ? 'high' :
    minutesPlayed >= 10 ? 'medium' : 'low'

  return {
    player,
    projectedPoints:   Math.round(projectedPoints * 10) / 10,
    projectedRebounds: Math.round(projectedRebounds * 10) / 10,
    projectedAssists:  Math.round(projectedAssists * 10) / 10,
    remainingMinutes:  Math.round(remainingMinutes * 10) / 10,
    confidence,
  }
}

export function getDeviation(projected: number, propLine: number): number {
  if (propLine <= 0) return 0
  return (projected - propLine) / propLine
}