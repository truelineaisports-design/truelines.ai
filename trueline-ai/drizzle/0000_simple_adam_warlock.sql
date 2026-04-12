CREATE TABLE "games" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"game_date" timestamp with time zone NOT NULL,
	"home_team" char(3) NOT NULL,
	"away_team" char(3) NOT NULL,
	"status" varchar(20) DEFAULT 'scheduled' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "generations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"generation_type" varchar(30) DEFAULT 'parlay' NOT NULL,
	"total_cost_usd" numeric(10, 6) DEFAULT '0' NOT NULL,
	"ceiling_breached" boolean DEFAULT false NOT NULL,
	"model_calls" jsonb DEFAULT '[]' NOT NULL,
	"total_latency_ms" integer,
	"error_message" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "injuries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"player_id" uuid NOT NULL,
	"status" varchar(20) NOT NULL,
	"description" varchar(255),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "line_movements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"game_id" uuid NOT NULL,
	"market" varchar(50) NOT NULL,
	"old_price" numeric(6, 2) NOT NULL,
	"new_price" numeric(6, 2) NOT NULL,
	"moved_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "odds" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"game_id" uuid NOT NULL,
	"market" varchar(50) NOT NULL,
	"selection" varchar(100) NOT NULL,
	"price" numeric(6, 2) NOT NULL,
	"bookmaker" varchar(50),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "parlay_legs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"parlay_id" uuid NOT NULL,
	"game_id" uuid NOT NULL,
	"player_id" uuid,
	"bet_type" varchar(30) NOT NULL,
	"prop_type" varchar(30),
	"selection" varchar(100) NOT NULL,
	"line" numeric(6, 2),
	"odds" numeric(8, 2) NOT NULL,
	"implied_probability" numeric(5, 4),
	"model_probability" numeric(5, 4),
	"outcome" varchar(20) DEFAULT 'pending' NOT NULL,
	"actual_value" numeric(8, 2),
	"leg_order" smallint NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "parlays" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slate_date" timestamp with time zone NOT NULL,
	"confidence" varchar(10) DEFAULT 'medium' NOT NULL,
	"combined_odds" numeric(10, 2) NOT NULL,
	"rationale" text NOT NULL,
	"is_featured" boolean DEFAULT false NOT NULL,
	"outcome" varchar(20) DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "player_stats" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"player_id" uuid NOT NULL,
	"game_id" uuid NOT NULL,
	"points" smallint,
	"rebounds" smallint,
	"assists" smallint,
	"steals" smallint,
	"blocks" smallint,
	"turnovers" smallint,
	"minutes_played" smallint,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "players" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nba_id" varchar(20) NOT NULL,
	"full_name" varchar(100) NOT NULL,
	"team" char(3) NOT NULL,
	"position" varchar(5),
	"active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "players_nba_id_unique" UNIQUE("nba_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clerk_id" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"display_name" varchar(100),
	"subscription_tier" varchar(20) DEFAULT 'free' NOT NULL,
	"daily_generations_used" smallint DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_clerk_id_unique" UNIQUE("clerk_id"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "injuries" ADD CONSTRAINT "injuries_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "line_movements" ADD CONSTRAINT "line_movements_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "odds" ADD CONSTRAINT "odds_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parlay_legs" ADD CONSTRAINT "parlay_legs_parlay_id_parlays_id_fk" FOREIGN KEY ("parlay_id") REFERENCES "public"."parlays"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parlay_legs" ADD CONSTRAINT "parlay_legs_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parlay_legs" ADD CONSTRAINT "parlay_legs_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_stats" ADD CONSTRAINT "player_stats_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_stats" ADD CONSTRAINT "player_stats_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_gen_ceiling" ON "generations" USING btree ("ceiling_breached");--> statement-breakpoint
CREATE INDEX "idx_gen_cost" ON "generations" USING btree ("total_cost_usd");--> statement-breakpoint
CREATE INDEX "idx_legs_parlay" ON "parlay_legs" USING btree ("parlay_id","leg_order");--> statement-breakpoint
CREATE INDEX "idx_legs_game" ON "parlay_legs" USING btree ("game_id");--> statement-breakpoint
CREATE INDEX "idx_parlays_date" ON "parlays" USING btree ("slate_date");--> statement-breakpoint
CREATE INDEX "idx_parlays_featured" ON "parlays" USING btree ("slate_date","is_featured");--> statement-breakpoint
CREATE INDEX "idx_users_clerk_id" ON "users" USING btree ("clerk_id");