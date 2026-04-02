import os
import time
import psycopg2
from nba_api.stats.endpoints import teamgamelog, boxscoretraditionalv3
from nba_api.stats.static import teams, players as nba_players

DATABASE_URL = os.environ["DATABASE_URL"]

def seed_players():
    all_players = nba_players.get_players()
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()
    
    for p in all_players:
        cur.execute("""
            INSERT INTO players (nba_id, full_name, team, position, active)
            VALUES (%s, %s, %s, %s, %s)
            ON CONFLICT DO NOTHING
        """, (str(p["id"]), p["full_name"], "UNK", None, p["is_active"]))
    
    conn.commit()
    cur.close()
    conn.close()
    print(f"Seeded {len(all_players)} players")

def seed_historical():
    all_teams = teams.get_teams()
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()

    for team in all_teams:
        time.sleep(1)
        try:
            log = teamgamelog.TeamGameLog(
                team_id=team["id"],
                season="2025-26",
                season_type_all_star="Regular Season"
            )
            games_data = log.get_dict()["resultSets"][0]["rowSet"]
            print(f"Processing {team['full_name']} — {len(games_data)} games")

            for game_row in games_data:
                nba_game_id = game_row[1]
                game_date = game_row[2]

                cur.execute("""
                    INSERT INTO games (game_date, home_team, away_team, status)
                    VALUES (%s, %s, %s, %s)
                    ON CONFLICT DO NOTHING
                    RETURNING id
                """, (game_date, team["abbreviation"], "UNK", "completed"))
                
                result = cur.fetchone()
                if result:
                    db_game_id = result[0]
                    time.sleep(1)
                    try:
                        trad = boxscoretraditionalv3.BoxScoreTraditionalV3(game_id=nba_game_id)
                        player_stats = trad.get_dict()["boxScoreTraditional"]["playerStats"]
                        
                        for p in player_stats:
                            cur.execute("SELECT id FROM players WHERE nba_id = %s", (str(p["personId"]),))
                            player = cur.fetchone()
                            if not player:
                                continue
                            cur.execute("""
                                INSERT INTO player_stats
                                (player_id, game_id, points, rebounds, assists, steals, blocks, turnovers)
                                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                                ON CONFLICT DO NOTHING
                            """, (
                                player[0], db_game_id,
                                p.get("points", 0),
                                p.get("reboundsTotal", 0),
                                p.get("assists", 0),
                                p.get("steals", 0),
                                p.get("blocks", 0),
                                p.get("turnovers", 0),
                            ))
                    except Exception as e:
                        print(f"Error fetching box score for {nba_game_id}: {e}")
                        continue

            conn.commit()
        except Exception as e:
            print(f"Error processing {team['full_name']}: {e}")
            continue

    cur.close()
    conn.close()
    print("Historical seeding complete!")

if __name__ == "__main__":
    print("Seeding players...")
    seed_players()
    print("Seeding historical stats...")
    seed_historical()