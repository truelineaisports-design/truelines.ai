import os
import psycopg2
from datetime import date
from nba_api.live.nba.endpoints import scoreboard as live_scoreboard

DATABASE_URL = os.environ["DATABASE_URL"]

def fetch_todays_games():
    sb = live_scoreboard.ScoreBoard()
    games_data = sb.get_dict()["scoreboard"]["games"]
    
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()
    
    for g in games_data:
        home_team = g["homeTeam"]["teamTricode"]
        away_team = g["awayTeam"]["teamTricode"]
        game_date = g["gameTimeUTC"]
        nba_game_id = g["gameId"]
        
        cur.execute("""
            INSERT INTO games (game_date, home_team, away_team, status)
            VALUES (%s, %s, %s, %s)
            ON CONFLICT DO NOTHING
        """, (game_date, home_team, away_team, 'scheduled'))
    
    conn.commit()
    cur.close()
    conn.close()
    print(f"Synced {len(games_data)} games for {date.today()}")

if __name__ == "__main__":
    fetch_todays_games()