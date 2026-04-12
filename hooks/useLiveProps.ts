import { useQuery } from '@tanstack/react-query'

export interface PropSuggestion {
  player: string
  team: string
  stat: string
  propLine: number
  projected: number
  direction: 'OVER' | 'UNDER'
  deviationPct: number
  explanation: string
  confidence: 'high' | 'medium' | 'low'
  minutesPlayed: number
}

export interface LiveGameData {
  game: {
    gameId: string
    homeTeam: string
    awayTeam: string
    homeScore: number
    awayScore: number
    period: number
    gameClock: string
  }
  suggestions: PropSuggestion[]
  generatedAt: number
  remainingMinutes: number
  blowout?: boolean
}

export function useLiveProps() {
  return useQuery({
    queryKey: ['live-props'],
    queryFn: async () => {
      const res = await fetch('/api/live-props')
      if (!res.ok) throw new Error('Failed to fetch live props')
      return res.json() as Promise<{
        games: LiveGameData[]
        gamesLive: boolean
        message?: string
      }>
    },
    refetchInterval: (query) => {
      if (query.state.data?.gamesLive === false) return false
      return 30_000
    },
    refetchIntervalInBackground: true,
    staleTime: 10_000,
  })
}