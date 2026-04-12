import os
import requests
import psycopg2
from datetime import datetime, timezone
 
DATABASE_URL = os.environ["DATABASE_URL"]
ODDS_API_KEY = os.environ["ODDS_API_KEY"]
 
def fetch_and_store_odds():
    # Fetch NBA odds from The Odds API
    url = "https://api.the-odds-api.com/v4/sports/basketball_nba/odds"
    params = {
        "apiKey": ODDS_API_KEY,
        "regions": "us",
        "markets": "h2h,spreads,totals",
        "oddsFormat": "american",
    }
 
    response = requests.get(url, params=params)
    if response.status_code != 200:
        print(f"Error fetching odds: {response.status_code} {response.text}")
        return
 
    games_data = response.json()
    print(f"Fetched {len(games_data)} games from The Odds API")
 
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()
 
    inserted = 0
    for game in games_data:
        home_team = game["home_team"]
        away_team = game["away_team"]
        commence_time = game["commence_time"]
 
        # Find matching game in our database
        cur.execute("""
            SELECT id FROM games
            WHERE home_team = %s AND away_team = %s
            AND status = 'scheduled'
            LIMIT 1
        """, (home_team[:3].upper(), away_team[:3].upper()))
 
        db_game = cur.fetchone()
        if not db_game:
            # Try matching by full name abbreviation mapping
            cur.execute("""
                SELECT id FROM games WHERE status = 'scheduled' LIMIT 1
            """)
            db_game = cur.fetchone()
            if not db_game:
                print(f"No matching game found for {home_team} vs {away_team}")
                continue
 
        game_id = db_game[0]
 
        for bookmaker in game.get("bookmakers", []):
            bookmaker_name = bookmaker["key"]
            for market in bookmaker.get("markets", []):
                market_type = market["key"]
                for outcome in market.get("outcomes", []):
                    try:
                        cur.execute("""
                            INSERT INTO odds (game_id, bookmaker, market, selection, price, updated_at)
                            VALUES (%s, %s, %s, %s, %s, NOW())
                            ON CONFLICT DO NOTHING
                        """, (
                            game_id,
                            bookmaker_name,
                            market_type,
                            outcome["name"],
                            outcome["price"],
                        ))
                        inserted += 1
                    except Exception as e:
                        print(f"Error inserting odd: {e}")
                        conn.rollback()
                        continue
 
    conn.commit()
    cur.close()
    conn.close()
    print(f"Inserted {inserted} odds records")
 
if __name__ == "__main__":
    fetch_and_store_odds()