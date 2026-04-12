import { pgTable, uuid, varchar, boolean, smallint,
  decimal, timestamp, index, uniqueIndex, char,
  text, jsonb, integer } from 'drizzle-orm/pg-core';

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

export const parlays = pgTable('parlays', {
  id: uuid('id').primaryKey().defaultRandom(),
  slateDate: timestamp('slate_date', { withTimezone: true }).notNull(),
  confidence: varchar('confidence', { length: 10 }).notNull().default('medium'),
  combinedOdds: decimal('combined_odds', { precision: 10, scale: 2 }).notNull(),
  rationale: text('rationale').notNull(),
  isFeatured: boolean('is_featured').notNull().default(false),
  outcome: varchar('outcome', { length: 20 }).notNull().default('pending'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  dateIdx: index('idx_parlays_date').on(t.slateDate),
  featuredIdx: index('idx_parlays_featured').on(t.slateDate, t.isFeatured),
}));

export const parlayLegs = pgTable('parlay_legs', {
  id: uuid('id').primaryKey().defaultRandom(),
  parlayId: uuid('parlay_id').notNull().references(() => parlays.id, { onDelete: 'cascade' }),
  gameId: uuid('game_id').notNull().references(() => games.id),
  playerId: uuid('player_id').references(() => players.id),
  betType: varchar('bet_type', { length: 30 }).notNull(),
  propType: varchar('prop_type', { length: 30 }),
  selection: varchar('selection', { length: 100 }).notNull(),
  line: decimal('line', { precision: 6, scale: 2 }),
  odds: decimal('odds', { precision: 8, scale: 2 }).notNull(),
  impliedProbability: decimal('implied_probability', { precision: 5, scale: 4 }),
  modelProbability: decimal('model_probability', { precision: 5, scale: 4 }),
  outcome: varchar('outcome', { length: 20 }).notNull().default('pending'),
  actualValue: decimal('actual_value', { precision: 8, scale: 2 }),
  legOrder: smallint('leg_order').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  parlayIdx: index('idx_legs_parlay').on(t.parlayId, t.legOrder),
  gameIdx: index('idx_legs_game').on(t.gameId),
}));

export const generations = pgTable('generations', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id'),
  generationType: varchar('generation_type', { length: 30 }).notNull().default('parlay'),
  totalCostUsd: decimal('total_cost_usd', { precision: 10, scale: 6 }).notNull().default('0'),
  ceilingBreached: boolean('ceiling_breached').notNull().default(false),
  modelCalls: jsonb('model_calls').notNull().default('[]'),
  totalLatencyMs: integer('total_latency_ms'),
  errorMessage: text('error_message'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  ceilingIdx: index('idx_gen_ceiling').on(t.ceilingBreached),
  costIdx: index('idx_gen_cost').on(t.totalCostUsd),
}));

// USER BANKROLLS
export const userBankrolls = pgTable('user_bankrolls', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  bankrollAmount: decimal('bankroll_amount', { precision: 12, scale: 2 }).notNull().default('1000.00'),
  riskTier: varchar('risk_tier', { length: 20 }).notNull().default('standard'),
  kellyFraction: decimal('kelly_fraction', { precision: 5, scale: 3 }).notNull().default('0.500'),
  initialBankroll: decimal('initial_bankroll', { precision: 12, scale: 2 }).notNull(),
  peakBankroll: decimal('peak_bankroll', { precision: 12, scale: 2 }).notNull(),
  maxDrawdownPct: decimal('max_drawdown_pct', { precision: 5, scale: 2 }).default('0.00'),
  totalWagered: decimal('total_wagered', { precision: 12, scale: 2 }).notNull().default('0.00'),
  totalWon: decimal('total_won', { precision: 12, scale: 2 }).notNull().default('0.00'),
  totalLost: decimal('total_lost', { precision: 12, scale: 2 }).notNull().default('0.00'),
  winCount: integer('win_count').notNull().default(0),
  lossCount: integer('loss_count').notNull().default(0),
  currentStreak: integer('current_streak').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  userIdx: index('idx_bankroll_user').on(t.userId),
}));

// BET OUTCOMES
export const betOutcomes = pgTable('bet_outcomes', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  parlayId: uuid('parlay_id').references(() => parlays.id),
  bankrollId: uuid('bankroll_id').notNull().references(() => userBankrolls.id),
  betType: varchar('bet_type', { length: 20 }).notNull().default('parlay'),
  stakeAmount: decimal('stake_amount', { precision: 10, scale: 2 }).notNull(),
  potentialPayout: decimal('potential_payout', { precision: 12, scale: 2 }),
  actualPayout: decimal('actual_payout', { precision: 12, scale: 2 }),
  kellyStakePct: decimal('kelly_stake_pct', { precision: 8, scale: 6 }),
  oddsAtPlacement: decimal('odds_at_placement', { precision: 8, scale: 2 }).notNull(),
  sportsbook: varchar('sportsbook', { length: 50 }),
  outcome: varchar('outcome', { length: 20 }).notNull().default('pending'),
  placedAt: timestamp('placed_at', { withTimezone: true }).notNull().defaultNow(),
  settledAt: timestamp('settled_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  userIdx: index('idx_bets_user').on(t.userId),
  outcomeIdx: index('idx_bets_outcome').on(t.outcome),
  parlayIdx: index('idx_bets_parlay').on(t.parlayId),
}));