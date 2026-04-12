import os
import time
import psycopg2
from nba_api.stats.endpoints import boxscoretraditionalv3

DATABASE_URL = os.environ["DATABASE_URL"]

def parse_minutes(iso_duration: str) -> float:
    if not iso_duration or iso_duration == "PT":
        return 0.0
    parts = iso_duration.replace("PT", "").replace("S", "").split("M")
    return round(float(parts[0]) + float(parts[1] if parts[1] else 0) / 60, 2)

def fetch_boxscore(nba_game_id: str, db_game_id: str):
    time.sleep(1)
    trad = boxscoretraditionalv3.BoxScoreTraditionalV3(game_id=nba_game_id)
    players = trad.get_dict()["boxScoreTraditional"]["playerStats"]

    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()

    for p in players:
        cur.execute("SELECT id FROM players WHERE nba_id = %s", (str(p["personId"]),))
        player = cur.fetchone()
        if not player:
            continue

        cur.execute("""
            INSERT INTO player_stats 
            (player_id, game_id, points, rebounds, assists, steals, blocks, turnovers, minutes_played)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT DO NOTHING
        """, (
            player[0], db_game_id,
            p.get("points", 0),
            p.get("reboundsTotal", 0),
            p.get("assists", 0),
            p.get("steals", 0),
            p.get("blocks", 0),
            p.get("turnovers", 0),
            parse_minutes(p.get("minutesCalculated", "PT")),
        ))

    conn.commit()
    cur.close()
    conn.close()
    print(f"Stored box score for game {nba_game_id}")

if __name__ == "__main__":
    import sys
    if len(sys.argv) == 3:
        fetch_boxscore(sys.argv[1], sys.argv[2])
    else:
        print("Usage: python3 fetch_boxscores.py <nba_game_id> <db_game_id>")