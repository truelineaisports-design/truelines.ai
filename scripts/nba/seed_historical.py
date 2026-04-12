def seed_players():
    all_players = nba_players.get_players()
    all_teams = teams.get_teams()
    
    # Build a lookup of nba player_id -> team abbreviation
    from nba_api.stats.endpoints import commonteamroster
    player_team_map = {}
    
    for team in all_teams:
        time.sleep(1)
        try:
            roster = commonteamroster.CommonTeamRoster(team_id=team["id"], season="2025-26")
            players_data = roster.get_dict()["resultSets"][0]["rowSet"]
            for row in players_data:
                player_id = str(row[14])  # PLAYER_ID column
                player_team_map[player_id] = team["abbreviation"]
        except Exception as e:
            print(f"Error fetching roster for {team['full_name']}: {e}")
            continue
    
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()
    
    for p in all_players:
        team_abbr = player_team_map.get(str(p["id"]), "UNK")
        cur.execute("""
            INSERT INTO players (nba_id, full_name, team, position, active)
            VALUES (%s, %s, %s, %s, %s)
            ON CONFLICT (nba_id) DO UPDATE SET team = EXCLUDED.team
        """, (str(p["id"]), p["full_name"], team_abbr, None, p["is_active"]))
    
    conn.commit()
    cur.close()
    conn.close()
    print(f"Seeded {len(all_players)} players with team assignments")