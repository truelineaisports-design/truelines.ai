import os
import psycopg2
import requests
from datetime import datetime, timezone

DATABASE_URL = os.environ["DATABASE_URL"]

STATUS_MAP = {
    "Out": "out",
    "Doubtful": "doubtful",
    "Questionable": "questionable",
    "Probable": "probable",
    "Available": "available",
    "Day-To-Day": "questionable",
}

def calculate_impact_score(status: str, position: str) -> float:
    position_weight = {"PG": 1.0, "SG": 0.85, "SF": 0.80, "PF": 0.75, "C": 0.80}.get(position, 0.70)
    status_weight = {"out": 1.0, "doubtful": 0.80, "questionable": 0.50, "probable": 0.20, "available": 0.0}.get(status, 0.50)
    return round(position_weight * status_weight, 2)

def fetch_and_store_injuries():
    # Use ESPN's public injury API
    url = "https://site.api.espn.com/apis/site/v2/sports/basketball/nba/injuries"
    headers = {"User-Agent": "Mozilla/5.0"}
    
    try:
        response = requests.get(url, headers=headers, timeout=30)
        data = response.json()
    except Exception as e:
        print(f"Error fetching injuries: {e}")
        return

    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()
    now = datetime.now(timezone.utc)
    new_count = changed_count = 0

    teams = data.get("injuries", [])
    for team in teams:
        for injury in team.get("injuries", []):
            athlete = injury.get("athlete", {})
            full_name = athlete.get("displayName", "")
            status = STATUS_MAP.get(injury.get("status", "Questionable"), "questionable")
            reason = injury.get("details", {}).get("type", "")

            cur.execute("SELECT id, position FROM players WHERE full_name = %s", (full_name,))
            row = cur.fetchone()
            if not row:
                continue

            player_uuid, position = row

            cur.execute("SELECT status FROM injuries WHERE player_id = %s ORDER BY updated_at DESC LIMIT 1", (player_uuid,))
            prev = cur.fetchone()

            if not prev or prev[0] != status:
                cur.execute("""
                    INSERT INTO injuries (player_id, status, description, updated_at)
                    VALUES (%s, %s, %s, %s)
                """, (player_uuid, status, reason, now))
                if not prev:
                    new_count += 1
                else:
                    changed_count += 1

    conn.commit()
    cur.close()
    conn.close()
    print(f"Injuries: {new_count} new, {changed_count} changed")

if __name__ == "__main__":
    fetch_and_store_injuries()