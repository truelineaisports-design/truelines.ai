import { useQuery } from '@tanstack/react-query'

async function fetchGames() {
  const res = await fetch('/api/games')
  if (!res.ok) throw new Error('Failed to fetch games')
  return res.json()
}

export function useGames() {
  return useQuery({
    queryKey: ['games', 'today'],
    queryFn: fetchGames,
    staleTime: 5 * 60 * 1000,
  })
}