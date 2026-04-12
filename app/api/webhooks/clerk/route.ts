import { headers } from 'next/headers'
import { Webhook } from 'svix'
import { db } from '@/lib/db/client'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET
  if (!WEBHOOK_SECRET) return new Response('Missing WEBHOOK_SECRET', { status: 500 })

  const headerPayload = await headers()
  const svix_id = headerPayload.get('svix-id')
  const svix_timestamp = headerPayload.get('svix-timestamp')
  const svix_signature = headerPayload.get('svix-signature')

  if (!svix_id || !svix_timestamp || !svix_signature)
    return new Response('Missing svix headers', { status: 400 })

  const body = JSON.stringify(await req.json())
  const wh = new Webhook(WEBHOOK_SECRET)
  let event: any
  try {
    event = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    })
  } catch {
    return new Response('Invalid signature', { status: 400 })
  }

  if (event.type === 'user.created') {
    const { id, email_addresses, first_name, last_name } = event.data
    const email = email_addresses[0]?.email_address ?? ''
    const displayName = [first_name, last_name].filter(Boolean).join(' ') || null

    await db.insert(users).values({
      clerkId: id,
      email,
      displayName,
    }).onConflictDoUpdate({
      target: users.clerkId,
      set: {
        email,
        displayName,
        updatedAt: new Date(),
      }
    }).catch(async () => {
      // If conflict on email, just update by clerkId
      await db.update(users).set({
        email,
        displayName,
        updatedAt: new Date(),
      }).where(eq(users.clerkId, id))
    })
  }

  if (event.type === 'user.updated') {
    const { id, email_addresses, first_name, last_name } = event.data
    await db.update(users)
      .set({
        email: email_addresses[0]?.email_address ?? '',
        displayName: [first_name, last_name].filter(Boolean).join(' ') || null,
        updatedAt: new Date(),
      })
      .where(eq(users.clerkId, id))
  }

  if (event.type === 'user.deleted') {
    await db.delete(users).where(eq(users.clerkId, event.data.id))
  }

  return new Response('OK', { status: 200 })
}