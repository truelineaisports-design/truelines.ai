import { NextResponse } from 'next/server'
import { Redis } from '@upstash/redis'
import { auth } from '@clerk/nextjs/server'

const redis = Redis.fromEnv()

export async function GET() {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const keys = await redis.keys('live:*')

    if (keys.length === 0) {
      return NextResponse.json({
        games: [],
        gamesLive: false,
        message: 'No live games right now. Check back during game time.',
      })
    }

    const gameDataList = await Promise.all(
      keys.map(async (key) => {
        const raw = await redis.get<string>(key)
        if (!raw) return null
        return typeof raw === 'string' ? JSON.parse(raw) : raw
      })
    )

    const games = gameDataList.filter(Boolean)

    return NextResponse.json({
      games,
      gamesLive: true,
      count: games.length,
    })
  } catch (error) {
    console.error('Live props API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch live props' },
      { status: 500 }
    )
  }
}