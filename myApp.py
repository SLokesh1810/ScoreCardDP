from flask import Flask, render_template, request, redirect, url_for, session, jsonify
import mysql.connector
import datetime
from itertools import zip_longest

mydb = mysql.connector.connect(
    user="root",    
    password="Sjeyaloki@05",
    database="scorecard"
)

cursor = mydb.cursor()

def cricketTableCreate(tableName,teamAname,teamBname,winner,teamAscore,teamBscore,teamAovers,teamBovers,extraA,extraB,timestamp):
    cursor.execute(f"""CREATE TABLE `overall{tableName}`(
                        teamA VARCHAR(255),
                        teamB VARCHAR(255),
                        Ascore VARCHAR(6),
                        Aovers DECIMAL(5,1),
                        Bscore VARCHAR(6),
                        Bovers DECIMAL(5,1),
                        winner VARCHAR(255),
                        Aextras INT,
                        Bextras INT,
                        createdTime DATETIME);""")
    mydb.commit()

    cursor.execute(f"""INSERT INTO `overall{tableName}` 
                   (teamA, teamB, Ascore, Aovers, Bscore, Bovers, winner, Aextras, Bextras, createdTime)
                   VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s);""",
               (teamAname, teamBname, teamAscore, teamAovers, teamBscore, teamBovers, winner, extraA, extraB, timestamp))

    mydb.commit()

def strikeRateCal(runs, balls):
    return (runs / balls) * 100 if balls > 0 else 0

def oversCal(over,ball):
    balls = (ball%6)/10
    overs = over + balls
    return overs

def economyCal(over,ball,runs):
    convertedBalls = oversCal(0,ball)/6
    over += convertedBalls
    return runs / over if over > 0 else 0 

def cricketInningsTables(tableName, firstInnings, secondInnings):
    playersDetA = firstInnings.get("players")
    Abowlers = firstInnings.get("bowlerStats")

    playersDetB = secondInnings.get("players")
    Bbowlers = secondInnings.get("bowlerStats")

    # First Innings Tables
    cursor.execute(f"""
        CREATE TABLE `{tableName}batters`(
            player VARCHAR(255),
            runs INT,
            balls INT,
            fours INT,
            six INT,
            sr INT,
            innings VARCHAR(255)
        );
    """)
    mydb.commit()

    cursor.execute(f"""
        CREATE TABLE `{tableName}bowlers`(
            player VARCHAR(255),
            overs INT,
            runs INT,
            wicket INT,
            economy INT,
            innings VARCHAR(255)
        );
    """)
    mydb.commit()

    for player, stats in playersDetA.items():
        strikeRate = strikeRateCal(stats['runs'], stats['balls'])
        cursor.execute(
            f"""INSERT INTO `{tableName}batters` 
                (player, runs, balls, fours, six, sr, innings)
                VALUES (%s, %s, %s, %s, %s, %s, "firstbat");""",
            (
                player, stats['runs'], stats['balls'],
                stats['fours'], stats['sixes'],
                strikeRate
            )
        )
    mydb.commit()

    for bowler,stats in Abowlers.items():
        print(bowler)
        overs = oversCal(stats['overs'], stats['balls'])
        economy = economyCal(stats['overs'], stats['balls'], stats['runs'])
        cursor.execute(
            f"""INSERT INTO `{tableName}bowlers` 
                (player, overs, runs, wicket, economy, innings)
                VALUES (%s, %s, %s, %s, %s, "firstbowl");""",
            (
                bowler,
                overs,
                stats['runs'],
                stats['wickets'],
                economy
            )
        )
    mydb.commit()

    for player, stats in playersDetB.items():
        strikeRate = strikeRateCal(stats['runs'], stats['balls'])
        cursor.execute(
            f"""INSERT INTO `{tableName}batters` 
                (player, runs, balls, fours, six, sr, innings)
                VALUES (%s, %s, %s, %s, %s, %s, "secondbat");""",
            (
                player, stats['runs'], stats['balls'],
                stats['fours'], stats['sixes'],
                strikeRate
            )
        )
    mydb.commit()

    for bowler,stats in Bbowlers.items():
        overs = oversCal(stats['overs'], stats['balls'])
        economy = economyCal(stats['overs'], stats['balls'], stats['runs'])
        cursor.execute(
            f"""INSERT INTO `{tableName}bowlers` 
                (player, overs, runs, wicket, economy, innings)
                VALUES (%s, %s, %s, %s, %s, "secondbowl");""",
            (
                bowler,
                overs,
                stats['runs'],
                stats['wickets'],
                economy
            )
        )
    mydb.commit()

def cricketDelete(tableName):
    cursor.execute(f"""DROP TABLE `overall{tableName}`;""")
    mydb.commit()

    cursor.execute(f"""DROP TABLE `{tableName}batters`;""")
    mydb.commit()

    cursor.execute(f"""DROP TABLE `{tableName}bowlers`;""")
    mydb.commit()
    

def foottableCreate(tableName, teamAname, teamBname, score, endTime, dateNtime, teamAdet, teamBdet):
    cursor.execute(f"""CREATE TABLE `overall{tableName}`(
                        teamA VARCHAR(255),
                        teamB VARCHAR(255),
                        score VARCHAR(5),
                        endTime VARCHAR(30),
                        createdTime DATETIME);""")
    mydb.commit()

    cursor.execute(f"""INSERT INTO `overall{tableName}` (teamA, teamB, score, endTime, createdTime)
                       VALUES (%s, %s, %s, %s, %s);""",
                   (teamAname, teamBname, score, endTime, dateNtime))
    mydb.commit()

    cursor.execute(f"""CREATE TABLE `{tableName}players` (
                        player VARCHAR(255),
                        goals INT,
                        assists INT,
                        yellow_cards INT,
                        red_cards INT,
                        team VARCHAR(255));""")
    mydb.commit()

    for player in teamAdet['players']:
        cursor.execute(f"""INSERT INTO `{tableName}players` (player, goals, assists, yellow_cards, red_cards, team)
                           VALUES (%s, %s, %s, %s, %s, "teamA");""",
                       (player['name'], player['goals'], player['assists'],
                        player['yellowCards'], player['redCards']))
    mydb.commit()

    for player in teamBdet['players']:
        cursor.execute(f"""INSERT INTO `{tableName}players` (player, goals, assists, yellow_cards, red_cards, team)
                           VALUES (%s, %s, %s, %s, %s,"teamB");""",
                       (player['name'], player['goals'], player['assists'],
                        player['yellowCards'], player['redCards']))
    mydb.commit()

    cursor.execute(f"""CREATE TABLE `{tableName}events` (
                        Aevents VARCHAR(255),
                        Bevents VARCHAR(255));""")
    mydb.commit()

    for eventsA, eventsB in zip_longest(teamAdet['events'], teamBdet['events'], fillvalue="NULL"):
        cursor.execute(f"""INSERT INTO `{tableName}events` (Aevents, Bevents)
                           VALUES (%s, %s);""", (eventsA, eventsB))
    mydb.commit()

def footballDelete(tableName):
    cursor.execute(f"""DROP TABLE `overall{tableName}`;""")
    mydb.commit()

    cursor.execute(f"""DROP TABLE `{tableName}players`;""")
    mydb.commit()

    cursor.execute(f"""DROP TABLE `{tableName}events`;""")
    mydb.commit()


myApp = Flask(__name__)
myApp.secret_key = "DPscorecard"

@myApp.route("/")
def homePage():
    return render_template("mainPage.html")

@myApp.route("/LoginPage", methods=["GET", "POST"])
def Login():
    if request.method == "POST":
        userid = request.form.get("UserID")
        password = request.form.get("Password")

        cursor.execute("SELECT * FROM users WHERE userID = %s;", (userid,))
        user = cursor.fetchone()

        if user:
            if user[1] == password:
                session['userid'] = user[2]
                session['username'] = user[0]
                return render_template("mainPageLogin.html", username=user[0])
            else:
                return render_template("index.html", error=True)
        else:
            return render_template("index.html", user_exists=False)

    return render_template("index.html")

@myApp.route("/signUpPage", methods=["GET", "POST"])
def signUp():
    if request.method == "POST":
        username = request.form.get("Username")
        userid = request.form.get("UserID")
        password = request.form.get("Password")

        cursor.execute("SELECT * FROM users WHERE userID = %s;", (userid,))
        user = cursor.fetchone()

        if user:
            return render_template("signUp.html", error=True)
        else:
            cursor.execute("INSERT INTO users (username, password, userID) VALUES (%s, %s, %s);",
                           (username, password, userid))
            mydb.commit()
            session['userid'] = userid
            session['username'] = username
            return redirect(url_for("mainPageLogin"))

    return render_template("signUp.html", error=False)

@myApp.route("/mainPageLogged")
def mainPageLogin():
    userid = session.get("userid")
    username = session.get("username")
    return render_template("mainPageLogin.html", username=username, userid=userid)

@myApp.route("/cricketHome")
def cricketHome():
    userid = session.get("userid")
    username = session.get("username")
    sport = "cricket"
    tablesdet = dict()
    subLen = len(userid+sport) + 7

    try:
        cursor.execute(f"SHOW TABLES LIKE 'overall{userid}{sport}%';")
        tables = cursor.fetchall()
        print(tables)

        for table in tables:
            table_name = table[0]
            print(table_name)
            cursor.execute(f"SELECT * FROM `{table_name}`;")
            details = cursor.fetchall()

            if details:
                row = details[0]
                game_title = "" + table_name[subLen:]
                print(game_title)
                tablesdet[table_name] = {
                    "game_name": game_title,
                    "teamA": row[0],
                    "teamB": row[1],
                    "scoreA": row[2],
                    "oversA": row[3],
                    "scoreB": row[4],
                    "oversB": row[5],
                    "winner": row[6],
                    "dateNtime": row[9]
                }
    except Exception as e:
        print("Error loading tables:", e)

    return render_template("cricketHome.html", username=username, userid=userid, tablesdet=tablesdet)

@myApp.route("/cricketHome/cricketPage", methods=["GET", "POST"])
def cricketPage():
    userid = session.get("userid")
    username = session.get("username")
    sport = "cricket"
    table = False

    if request.method == "POST":
        data = request.get_json()
        if "gn" in data:
            gameName = data.get("gn")
            if gameName:
                tableName = (userid + sport + gameName).lower()

                try:
                    cursor.execute(f"SELECT * FROM `overall{tableName}`;")
                    table = cursor.fetchone()
                except Exception as e:
                    print("Table check failed:", e)

                if table:
                    return jsonify({"error": True})
                else :
                    return jsonify({"error": False})
        
        elif "matchData" in data:
            
            match_data = data.get("matchData")

            gameName = match_data.get("gameName")
            firstInnings = match_data.get("firstInnings")
            secondInnings = match_data.get("secondInnings")
            winner = match_data.get("winner")

            teamAname = firstInnings.get("teamName")
            teamBname = secondInnings.get("teamName")

            teamAscore = str(firstInnings.get("teamScore")) + "/" + str(firstInnings.get("wickets")) 
            teamBscore = str(secondInnings.get("teamScore")) + "/" + str(secondInnings.get("wickets"))

            teamAovers = firstInnings.get("overs")
            teamBovers = secondInnings.get("overs")

            extraA = firstInnings.get("extras")
            extraB = secondInnings.get("extras")
            
            timestamp = datetime.datetime.now()
            tableName = (userid + sport + gameName).lower()
            
            try:
                cricketTableCreate(tableName, teamAname, teamBname, winner, teamAscore, teamBscore, teamAovers, teamBovers, extraA, extraB, timestamp)
                cricketInningsTables(tableName, firstInnings, secondInnings)
                return jsonify({"success": True, "redirect": url_for('cricketView', gameName=gameName, tableName=tableName, userid=userid)})
            except Exception as e:
                print("Upload matchData error:", e)
                return jsonify({"success": False, "error": str(e)})


    return render_template("cricketPage.html", username=username, userid=userid)

@myApp.route("/cricket/cricketView", methods=["GET","POST"])
def cricketView():
    userid = session.get("userid")
    username = session.get("username")
    sport = 'cricket'

    if request.method == "POST":
        data = request.get_json()
        print(data)
        gameName = data['gameName']
        tableName = userid + sport + gameName
        if data['delete']:
            cricketDelete(tableName)
            print("deleted")
            return jsonify({"success": True, "redirect": url_for('cricketHome', username=username , userid=userid)})
        else:
            print(e)
            return jsonify({"success": False, "error": str(e)})
        
    gameName = request.args.get("gameName")
    tableName = request.args.get("tableName")

    if tableName :
        tableName = tableName
    else:
        tableName = userid + sport + gameName

    if not tableName:
        return "Error: Missing table name", 400

    try:
        cursor.execute(f"SELECT * FROM `overall{tableName}`")
        overalldet = cursor.fetchall()

        cursor.execute(f"SELECT player, runs, balls, fours, six, sr FROM `{tableName}batters` WHERE innings = 'firstbat'")
        firstBatdet = cursor.fetchall()

        cursor.execute(f"SELECT player, runs, balls, fours, six, sr FROM `{tableName}batters` WHERE innings = 'secondbat'")
        secondBatdet = cursor.fetchall()

        cursor.execute(f"SELECT player, overs, runs, wicket, economy FROM `{tableName}bowlers` WHERE innings = 'firstbowl'")
        firstBowldet = cursor.fetchall()

        cursor.execute(f"SELECT player, overs, runs, wicket, economy FROM `{tableName}bowlers` WHERE innings = 'secondbowl'")
        secondBowldet = cursor.fetchall()

        return render_template("cricketView.html", gameName=gameName.upper() , overalldet=overalldet,
                               firstBatdet=firstBatdet, firstBowldet=firstBowldet, secondBatdet=secondBatdet, secondBowldet=secondBowldet)
    except Exception as e:
        print("Error loading match view:", e)

    return render_template("cricketView.html")

@myApp.route("/footballHome", methods=["GET", "POST"])
def footballHome():
    userid = session.get("userid")
    username = session.get("username")
    sport = "football"
    tablesdet = dict()
    subLen = len(userid+sport) + 7

    try:
        cursor.execute(f"SHOW TABLES LIKE 'overall{userid}{sport}%';")
        tables = cursor.fetchall()

        for table in tables:
            table_name = table[0]
            cursor.execute(f"SELECT * FROM `{table_name}`;")
            details = cursor.fetchall()

            if details:
                row = details[0]
                game_title = "" + table_name[subLen:]
                tablesdet[table_name] = {
                    "game_name": game_title,
                    "teamA": row[0],
                    "teamB": row[1],
                    "score": row[2],
                    "end_time": row[3],
                    "datetime": row[4]
                }
    except Exception as e:
        print("Error loading tables:", e)

    return render_template("footballHome.html", username=username, userid=userid, tablesdet=tablesdet)

@myApp.route("/footballHome/footballCreate", methods=["GET","POST"])
def createPage():
    username = session.get("username")
    userid = session.get("userid")
    sport = "football"
    table = False

    if request.method == "POST":
        data = request.get_json()
        gameName = data.get("gn")
        if gameName:
            tableName = (userid + sport + gameName).lower()

            try:
                cursor.execute(f"SELECT * FROM `overall{tableName}`;")
                table = cursor.fetchone()
            except Exception as e:
                print("Table check failed:", e)

            if table:
                return jsonify({"error": True})
            else :
                return jsonify({"error": False})

    return render_template("createPage.html")

@myApp.route("/footballHome/footballPage", methods=["GET", "POST"])
def footballPage():
    username = session.get("username")
    userid = session.get("userid")
    sport = "football"
    
    if request.method == "POST":
        data = request.get_json()
        match_summary = data.get("matchSummary")
        team_a_events = data.get("teamAEvents", {})
        team_b_events = data.get("teamBEvents", {})

        gameName = match_summary.get("gameName")
        team_a_name = match_summary.get("teamA")
        team_b_name = match_summary.get("teamB")
        team_a_score = match_summary["score"]["teamA"]
        team_b_score = match_summary["score"]["teamB"]
        duration = match_summary.get("duration")
        end_time = match_summary.get("endTime")

        tableName = (userid + sport + gameName).lower()
        totalScore = f"{team_a_score}:{team_b_score}"
        timestamp = datetime.datetime.now()

        try:
            foottableCreate(tableName, team_a_name, team_b_name, totalScore,
                            end_time, timestamp, team_a_events, team_b_events)
            return jsonify({"success": True, "redirect": url_for('footballView', gameName=gameName, tableName=tableName, userid=userid)})
        except Exception as e:
            print("Error during table creation:", e)

    return render_template("footballPage.html")

@myApp.route("/footballHome/view", methods=["GET", "POST"])
def footballView():
    username = session.get("username")
    userid = session.get("userid")
    sport = 'football'

    if request.method == "POST":
        print("a")
        data = request.get_json()
        if data['delete']:
            gameName = data['gameName']
            tableName = userid + sport + gameName
            footballDelete(tableName)
            return jsonify({"success": True, "redirect": url_for('footballHome', username=username , userid=userid)})
        else:
            return jsonify({"success": False, "error": str(e)})
        
    gameName = request.args.get("gameName")
    tableName = request.args.get("tableName")

    if tableName :
        tableName = tableName
    else:
        tableName = userid + sport + gameName

    if not tableName:
        return "Error: Missing table name", 400

    try:
        cursor.execute(f"SELECT * FROM `overall{tableName}`")
        overalldet = cursor.fetchall()

        cursor.execute(f"SELECT player, goals, assists, yellow_cards, red_cards FROM `{tableName}players` WHERE team = 'teamA'")
        teamAdet = cursor.fetchall()

        cursor.execute(f"SELECT player, goals, assists, yellow_cards, red_cards FROM `{tableName}players` WHERE team = 'teamB'")
        teamBdet = cursor.fetchall()

        cursor.execute(f"SELECT * FROM `{tableName}events`")
        eventdet = cursor.fetchall()

        return render_template("footballView.html", gameName=gameName.upper() , overalldet=overalldet,
                               teamAdet=teamAdet, teamBdet=teamBdet, eventdet=eventdet)
    except Exception as e:
        print("Error loading match view:", e)

    return render_template("footballView.html")

if __name__ == "__main__":
    myApp.run(debug=True)
