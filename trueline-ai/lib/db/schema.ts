import { pgTable, uuid, varchar, boolean, smallint,
  decimal, timestamp, index, uniqueIndex, char } from 'drizzle-orm/pg-core';

// GAMES
export const games = pgTable('games', {
  id: uuid('id').primaryKey().defaultRandom(),
  gameDate: timestamp('game_date', { withTimezone: true }).notNull(),
  homeTeam: char('home_team', { length: 3 }).notNull(),
  awayTeam: char('away_team', { length: 3 }).notNull(),
  status: varchar('status', { length: 20 }).notNull().default('scheduled'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// PLAYERS
export const players = pgTable('players', {
  id: uuid('id').primaryKey().defaultRandom(),
  nbaId: varchar('nba_id', { length: 20 }).notNull().unique(),
  fullName: varchar('full_name', { length: 100 }).notNull(),
  team: char('team', { length: 3 }).notNull(),
  position: varchar('position', { length: 5 }),
  active: boolean('active').notNull().default(true),
});

// PLAYER STATS
export const playerStats = pgTable('player_stats', {
  id: uuid('id').primaryKey().defaultRandom(),
  playerId: uuid('player_id').notNull().references(() => players.id),
  gameId: uuid('game_id').notNull().references(() => games.id),
  points: smallint('points'),
  rebounds: smallint('rebounds'),
  assists: smallint('assists'),
  steals: smallint('steals'),
  blocks: smallint('blocks'),
  turnovers: smallint('turnovers'),
  minutesPlayed: smallint('minutes_played'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// ODDS
export const odds = pgTable('odds', {
  id: uuid('id').primaryKey().defaultRandom(),
  gameId: uuid('game_id').notNull().references(() => games.id),
  market: varchar('market', { length: 50 }).notNull(),
  selection: varchar('selection', { length: 100 }).notNull(),
  price: decimal('price', { precision: 6, scale: 2 }).notNull(),
  bookmaker: varchar('bookmaker', { length: 50 }),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// LINE MOVEMENTS
export const lineMovements = pgTable('line_movements', {
  id: uuid('id').primaryKey().defaultRandom(),
  gameId: uuid('game_id').notNull().references(() => games.id),
  market: varchar('market', { length: 50 }).notNull(),
  oldPrice: decimal('old_price', { precision: 6, scale: 2 }).notNull(),
  newPrice: decimal('new_price', { precision: 6, scale: 2 }).notNull(),
  movedAt: timestamp('moved_at', { withTimezone: true }).defaultNow(),
});

// INJURIES
export const injuries = pgTable('injuries', {
  id: uuid('id').primaryKey().defaultRandom(),
  playerId: uuid('player_id').notNull().references(() => players.id),
  status: varchar('status', { length: 20 }).notNull(),
  description: varchar('description', { length: 255 }),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// ADD to lib/db/schema.ts
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  clerkId: varchar('clerk_id', { length: 255 }).notNull().unique(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  displayName: varchar('display_name', { length: 100 }),
  subscriptionTier: varchar('subscription_tier', { length: 20 }).notNull().default('free'),
  dailyGenerationsUsed: smallint('daily_generations_used').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  clerkIdIdx: index('idx_users_clerk_id').on(t.clerkId),
}));