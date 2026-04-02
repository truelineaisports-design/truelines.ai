import { defineConfig } from 'drizzle-kit';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const url = process.env.NODE_ENV === "production"
  ? process.env.DATABASE_URL
  : process.env.DEV_DATABASE_URL ?? process.env.DATABASE_URL;

if (!url) throw new Error('DATABASE_URL not found in environment');

export default defineConfig({
  dialect: 'postgresql',
  schema: './lib/db/schema.ts',
  out: './drizzle',
  dbCredentials: { url },
});