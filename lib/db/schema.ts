import { pgTable, uuid, varchar, boolean, smallint,
  decimal, timestamp, char, text, jsonb, integer } from 'drizzle-orm/pg-core';

// GAMES
export const games = pgTable('games', {
  id: uuid('id').primaryKey().defaultRandom(),
  externalId: varchar('external_id', { length: 100 }).unique(),
  nbaGameId: varchar('nba_game_id', { length: 50 }),
  homeTeam: varchar('home_team', { length: 50 }).notNull(),
  awayTeam: varchar('away_team', { length: 50 }).notNull(),
  homeTeamAbbr: char('home_team_abbr', { length: 3 }).notNull(),
  awayTeamAbbr: char('away_team_abbr', { length: 3 }).notNull(),
  scheduledAt: timestamp('scheduled_at', { withTimezone: true }).notNull(),
  gameDate: timestamp('game_date', { withTimezone: true }),
  status: varchar('status', { length: 20 }).notNull().default('scheduled'),
  homeScore: smallint('home_score'),
  awayScore: smallint('away_score'),
  quarter: smallint('quarter'),
  clock: varchar('clock', { length: 10 }),
  pace: decimal('pace', { precision: 5, scale: 1 }),
  season: varchar('season', { length: 10 }).notNull().default('2025-26'),
  seasonType: varchar('season_type', { length: 20 }).default('regular'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// PLAYERS
export const players = pgTable('players', {
  id: uuid('id').primaryKey().defaultRandom(),
  nbaPlayerId: integer('nba_player_id').unique(),
  nbaId: varchar('nba_id', { length: 20 }),
  fullName: varchar('full_name', { length: 100 }).notNull(),
  firstName: varchar('first_name', { length: 50 }),
  lastName: varchar('last_name', { length: 50 }),
  team: char('team', { length: 3 }),
  teamAbbr: char('team_abbr', { length: 3 }),
  position: varchar('position', { length: 5 }),
  jerseyNumber: varchar('jersey_number', { length: 3 }),
  isActive: boolean('is_active').notNull().default(true),
  active: boolean('active'),
  heightInches: smallint('height_inches'),
  weightLbs: smallint('weight_lbs'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
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
  minutesPlayed: decimal('minutes_played', { precision: 5, scale: 1 }),
  usageRate: decimal('usage_rate', { precision: 5, scale: 3 }),
  isStarter: boolean('is_starter'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// ODDS
export const odds = pgTable('odds', {
  id: uuid('id').primaryKey().defaultRandom(),
  gameId: uuid('game_id').notNull().references(() => games.id),
  bookmaker: varchar('bookmaker', { length: 50 }).notNull(),
  marketType: varchar('market_type', { length: 30 }).notNull(),
  market: varchar('market', { length: 50 }),
  playerId: uuid('player_id'),
  propType: varchar('prop_type', { length: 30 }),
  outcomeName: varchar('outcome_name', { length: 100 }).notNull(),
  selection: varchar('selection', { length: 100 }),
  price: decimal('price', { precision: 8, scale: 2 }).notNull(),
  point: decimal('point', { precision: 6, scale: 2 }),
  isLive: boolean('is_live').notNull().default(false),
  capturedAt: timestamp('captured_at', { withTimezone: true }),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// INJURIES
export const injuries = pgTable('injuries', {
  id: uuid('id').primaryKey().defaultRandom(),
  playerId: uuid('player_id').notNull().references(() => players.id),
  gameId: uuid('game_id'),
  status: varchar('status', { length: 20 }).notNull(),
  reason: varchar('reason', { length: 200 }),
  impactScore: decimal('impact_score', { precision: 3, scale: 2 }),
  reportedAt: timestamp('reported_at', { withTimezone: true }),
  source: varchar('source', { length: 50 }),
  description: varchar('description', { length: 200 }),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// PARLAYS
export const parlays = pgTable('parlays', {
  id: uuid('id').primaryKey().defaultRandom(),
  generationId: uuid('generation_id'),
  slateDate: timestamp('slate_date', { withTimezone: true }),
  confidence: varchar('confidence', { length: 10 }).notNull().default('medium'),
  combinedOdds: varchar('combined_odds', { length: 20 }).notNull(),
  impliedProbability: decimal('implied_probability', { precision: 5, scale: 4 }),
  evEstimate: decimal('ev_estimate', { precision: 6, scale: 4 }),
  rationale: text('rationale').notNull().default(''),
  parlayType: varchar('parlay_type', { length: 20 }).default('standard'),
  legCount: smallint('leg_count'),
  outcome: varchar('outcome', { length: 20 }).default('pending'),
  gradeDetails: jsonb('grade_details'),
  gradedAt: timestamp('graded_at', { withTimezone: true }),
  isFeatured: boolean('is_featured').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// PARLAY LEGS
export const parlayLegs = pgTable('parlay_legs', {
  id: uuid('id').primaryKey().defaultRandom(),
  parlayId: uuid('parlay_id').notNull().references(() => parlays.id),
  gameId: uuid('game_id').notNull().references(() => games.id),
  playerId: uuid('player_id'),
  betType: varchar('bet_type', { length: 30 }).notNull(),
  propType: varchar('prop_type', { length: 30 }),
  selection: varchar('selection', { length: 100 }).notNull(),
  line: varchar('line', { length: 20 }),
  odds: varchar('odds', { length: 20 }).notNull(),
  impliedProbability: varchar('implied_probability', { length: 20 }),
  modelProbability: varchar('model_probability', { length: 20 }),
  outcome: varchar('outcome', { length: 20 }).default('pending'),
  actualValue: decimal('actual_value', { precision: 8, scale: 2 }),
  gradedAt: timestamp('graded_at', { withTimezone: true }),
  legOrder: smallint('leg_order').notNull().default(1),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// USERS
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  clerkId: varchar('clerk_id', { length: 255 }).unique().notNull(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  displayName: varchar('display_name', { length: 100 }),
  subscriptionTier: varchar('subscription_tier', { length: 20 }).notNull().default('free'),
  stripeCustomerId: varchar('stripe_customer_id', { length: 255 }),
  dailyGenerationsUsed: smallint('daily_generations_used').notNull().default(0),
  dailyGenerationsResetAt: timestamp('daily_generations_reset_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// USER BANKROLLS
export const userBankrolls = pgTable('user_bankrolls', {
  maxDrawdownPct: decimal('max_drawdown_pct', { precision: 5, scale: 3 }),
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').unique().notNull().references(() => users.id),
  bankrollAmount: decimal('bankroll_amount', { precision: 12, scale: 2 }).notNull().default('0'),
  riskTier: varchar('risk_tier', { length: 20 }).notNull().default('standard'),
  kellyFraction: decimal('kelly_fraction', { precision: 4, scale: 3 }).notNull().default('0.500'),
  initialBankroll: decimal('initial_bankroll', { precision: 12, scale: 2 }).notNull().default('0'),
  peakBankroll: decimal('peak_bankroll', { precision: 12, scale: 2 }),
  totalWagered: decimal('total_wagered', { precision: 12, scale: 2 }).notNull().default('0'),
  totalWon: decimal('total_won', { precision: 12, scale: 2 }).notNull().default('0'),
  totalLost: decimal('total_lost', { precision: 12, scale: 2 }).notNull().default('0'),
  winCount: integer('win_count').notNull().default(0),
  lossCount: integer('loss_count').notNull().default(0),
  currentStreak: integer('current_streak').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// BET OUTCOMES
export const betOutcomes = pgTable('bet_outcomes', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  parlayId: uuid('parlay_id'),
  parlayLegId: uuid('parlay_leg_id'),
  bankrollId: uuid('bankroll_id'),
  betType: varchar('bet_type', { length: 20 }).notNull(),
  stakeAmount: decimal('stake_amount', { precision: 10, scale: 2 }).notNull(),
  potentialPayout: decimal('potential_payout', { precision: 12, scale: 2 }).notNull(),
  actualPayout: decimal('actual_payout', { precision: 12, scale: 2 }),
  kellyStakePct: decimal('kelly_stake_pct', { precision: 5, scale: 4 }),
  oddsAtPlacement: decimal('odds_at_placement', { precision: 8, scale: 2 }).notNull(),
  sportsbook: varchar('sportsbook', { length: 50 }),
  placedAt: timestamp('placed_at', { withTimezone: true }).defaultNow(),
  settledAt: timestamp('settled_at', { withTimezone: true }),
  outcome: varchar('outcome', { length: 20 }).notNull().default('pending'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// GENERATIONS
export const generations = pgTable('generations', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id'),
  generationType: varchar('generation_type', { length: 30 }).notNull().default('parlay'),
  status: varchar('status', { length: 20 }).notNull().default('completed'),
  totalCostUsd: varchar('total_cost_usd', { length: 20 }).notNull().default('0'),
  ceilingBreached: boolean('ceiling_breached').notNull().default(false),
  modelCalls: jsonb('model_calls').default('[]'),
  totalLatencyMs: integer('total_latency_ms'),
  errorMessage: text('error_message'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// LINE MOVEMENTS
export const lineMovements = pgTable('line_movements', {
  id: uuid('id').primaryKey().defaultRandom(),
  gameId: uuid('game_id').notNull().references(() => games.id),
  bookmaker: varchar('bookmaker', { length: 50 }).notNull(),
  marketType: varchar('market_type', { length: 30 }).notNull(),
  previousLine: decimal('previous_line', { precision: 6, scale: 2 }),
  currentLine: decimal('current_line', { precision: 6, scale: 2 }).notNull(),
  previousOdds: decimal('previous_odds', { precision: 8, scale: 2 }),
  currentOdds: decimal('current_odds', { precision: 8, scale: 2 }).notNull(),
  movementPct: decimal('movement_pct', { precision: 5, scale: 3 }),
  isSteamMove: boolean('is_steam_move').notNull().default(false),
  capturedAt: timestamp('captured_at', { withTimezone: true }).defaultNow(),
  movedAt: timestamp('captured_at', { withTimezone: true }).defaultNow(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});
