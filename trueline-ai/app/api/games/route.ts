import { NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { games } from '@/lib/db/schema'
import { gte, lte, and } from 'drizzle-orm'

export async function GET() {
  try {
    const today = new Date()
    const startOfDay = new Date(today.setHours(0, 0, 0, 0))
    const endOfDay = new Date(today.setHours(23, 59, 59, 999))

    const todaysGames = await db
      .select()
      .from(games)
      .where(and(gte(games.scheduledAt, startOfDay), lte(games.scheduledAt, endOfDay)))
      .orderBy(games.scheduledAt)

    return NextResponse.json(todaysGames)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to fetch games' }, { status: 500 })
  }
}