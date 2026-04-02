import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

const url = process.env.DEV_DATABASE_URL ?? process.env.DATABASE_URL;
const sql = neon(url!);
export const db = drizzle({ client: sql, schema });