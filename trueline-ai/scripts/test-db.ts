import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { db } from '../lib/db/client';
import { sql } from 'drizzle-orm';

async function main() {
  const result = await db.execute(sql`SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public'`);
  console.log('Tables in DB:', result.rows[0].count);
}

main().catch(console.error);