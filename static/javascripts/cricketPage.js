window.addEventListener("load", () => {
    const loader = document.querySelector(".loader-wrapper");
    
    // Trigger fade-out
    loader.style.opacity = "0";
    
    // Wait for the transition to complete before hiding
    setTimeout(() => {
        loader.style.visibility = "hidden";
    }, 500); // Match with your transition duration
});

let oversLimit;
let totalScore = 0;
let wickets = {
    "team1": 0,
    "team2": 0
};
let overs = 0;
let balls = 0;
let allout = {
    "team1": false,
    "team2": false
};
let target = -1;
let totalWickets = 0;

let batsmanOnStrike = "Batsman 1";
let batsmanNonStrike = "Batsman 2";
let currentBowler = "N/A";

let team1Players = [];
let team2Players = [];
let tossWinner = "";
let battingTeam = "";
let bowlingTeam = "";
let currentBatIndex = 2;

let playerStats = {};
let firstInningsStats = {};
let firstInningsScore = 0;
let currentInnings = 1;
let bowlerStats = {
    team1: {},
    team2: {}
};

let matchData = {
    gameName: "",

    firstInnings: {
        teamScore: 0,
        players: {},
        bowlerStats: {},
        wickets: 0,
        extras: 0,
        overs: 0
    },
    secondInnings: {
        teamScore: 0,
        players: {},
        bowlerStats: {},
        wickets: 0,
        extras: 0,
        overs: 0
    },
    finalScore: 0,
    wickets: 0,
    winner: ""
};


function gameNameSubmit() {
    let gameName = document.getElementById("gameName").value.trim();
    if (gameName !== "") {
        fetch('/cricketHome/cricketPage', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                gn: gameName
            })
        })
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    alert("Game name already exists! Please choose another.");
                    return;
                }
            })
        matchData.gameName = gameName;
        document.getElementsByClassName("GameName")[0].style.display = "none";
        document.getElementsByClassName("main-container")[0].style.display = "flex";
        document.getElementById("gameNameDis").textContent = gameName;
    } else {
        document.getElementById("gameNameErr").style.display = "block";
    }

}

function playerName(team) {
    let lab = document.getElementById(`lab-${team}`)
    let plnum = document.getElementById(`playernum-${team}`);
    let pllab = document.getElementById(`playernum-${team}-lab`);
    let plnamelab = document.getElementById(`playernum-${team}-names`);
    let teamdisp = document.getElementById(`display-${team}`);
    let container = document.getElementById(
        `plname${team === "team1" ? "1" : "2"}`
    );

    let plvalue = parseInt(plnum.value);

    if (isNaN(plvalue) || plvalue <= 0) {
        alert("Please enter a valid number of players.");
        return;
    } else if (plvalue <= 1) {
        alert("Players should be more than 1.");
        return;
    }

    lab.style.display = "none";
    plnum.style.display = "none";
    pllab.style.display = "none";
    plnamelab.style.display = "block";

    let existingButton = container.querySelector("button");
    if (existingButton) existingButton.style.display = "none";

    let existingInput = container.querySelector("input");
    if (existingInput) existingInput.style.display = "none"

    teamdisp.style.display = "block";
    let nameInputs = [];
    totalWickets = plvalue;
    for (let i = 0; i < plvalue; i++) {
        let plinput = document.createElement("input");
        plinput.classList.add("player-name-input", "player-input");
        plinput.placeholder = `Enter Player ${i + 1} Name`;
        container.appendChild(plinput);
        nameInputs.push(plinput);
        container.appendChild(document.createElement("br"));
    }

    let submitBtn = document.createElement("button");
    submitBtn.textContent = "FINAL SUBMIT";
    submitBtn.classList.add("btns", "submit-btn");
    submitBtn.style.margin = "10px";
    container.appendChild(submitBtn);

    submitBtn.addEventListener("click", function () {
        let playerNames = nameInputs
            .map((input) => input.value.trim())
            .filter((name) => name !== "");
        let teamNameInput = document.getElementById(`${team}-name`);
        let teamname = teamNameInput ? teamNameInput.value.trim() : "";

        if (!teamname || playerNames.length !== plvalue) {
            alert("Please enter the team name and all player names.");
            return;
        }

        if (team === "team1") {
            team1Players = playerNames;
            document.getElementById("a").style.display = "none";
            document.getElementById("a1").style.display = "block";
        } else {
            team2Players = playerNames;
            document.getElementById("a1").style.display = "none";
        }

        if (team1Players.length > 0 && team2Players.length > 0) {
            document.getElementById("tossSection").style.display = "block";
            startToss();
        }
    });
}

function startToss() {
    const tossSection = document.getElementById("tossSection");
    tossWinner = Math.random() < 0.5 ? "team1" : "team2";
    const winnerName =
        tossWinner === "team1"
            ? document.getElementById("team1-name").value
            : document.getElementById("team2-name").value;
    const tossLoser =
        tossWinner === "team2"
            ? document.getElementById("team1-name").value
            : document.getElementById("team2-name").value;
    document.getElementById(
        "tossResult"
    ).innerText = `${winnerName} won the toss!`;

    tossSection.style.display = "block";
    document.getElementById("chooseBat").onclick = () => handleTossChoice("bat", winnerName, tossLoser);
    document.getElementById("chooseBowl").onclick = () => handleTossChoice("bowl", winnerName, tossLoser);
}

function handleTossChoice(choice, winnerName, tossLoser) {
    if (choice === "bat") {
        battingTeam = tossWinner;
        bowlingTeam = tossWinner === "team1" ? "team2" : "team1";

        matchData.firstInnings.teamName = winnerName;
        matchData.secondInnings.teamName = tossLoser;
    } else {
        bowlingTeam = tossWinner;
        battingTeam = tossWinner === "team1" ? "team2" : "team1";

        matchData.secondInnings.teamName = winnerName;
        matchData.firstInnings.teamName = tossLoser;
    }

    const oversInput = document.getElementById("inp");
    const enteredOvers = parseInt(oversInput.value);

    if (isNaN(enteredOvers) || enteredOvers <= 0) {
        alert("Please enter a valid number of overs before starting the match!");
        return;
    }

    oversLimit = enteredOvers;
    oversInput.disabled = true;
    document.getElementById("ov").style.display = "none";
    document.getElementById("total-overs").textContent = `(${oversLimit})`;

    const batPlayers = battingTeam === "team1" ? team1Players : team2Players;
    batsmanOnStrike = batPlayers[0];
    batsmanNonStrike = batPlayers[1];
    currentBatIndex = 2;

    playerStats[batsmanOnStrike] = { runs: 0, balls: 0, fours: 0, sixes: 0 };
    playerStats[batsmanNonStrike] = { runs: 0, balls: 0, fours: 0, sixes: 0 };

    document.getElementById("batsmanOnStrike").innerText = batsmanOnStrike;
    document.getElementById("batsmanNonStrike").innerText = batsmanNonStrike;

    showBowlerDropdown();
    document.getElementById("tossSection").style.display = "none";
    document.getElementsByClassName("scorecard-container")[0].style.display = "block";
}

function showBowlerDropdown() {
    const bowlerSelect = document.getElementById("bowlerSelect");

    bowlerSelect.innerHTML = "";

    const bowlPlayers = bowlingTeam === "team1" ? team1Players : team2Players;
    const lastFive = bowlPlayers.slice(-5);

    lastFive.forEach((name) => {
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        bowlerSelect.appendChild(option);
    });

    bowlerSelect.addEventListener("change", () => {
        currentBowler = bowlerSelect.value;
        document.getElementById("currentBowler").innerText = currentBowler;
    });

    currentBowler = lastFive[0];
    bowlerSelect.value = currentBowler;
    document.getElementById("currentBowler").innerText = currentBowler;
}

const input1 = document.getElementById("inp");
if (input1) {
    input1.addEventListener("keydown", function (e) {
        if (e.key === "Enter") {
            oversLimit = parseInt(input1.value);
            document.getElementById("ov").style.display = "none";
            input1.style.display = "none";
            document.getElementById("total-overs").textContent = `(${oversLimit})`;
        }
    });
}

extras = 0;

function updateScoreboard() {
    document.getElementById("totalScore").innerText = totalScore;
    document.getElementById("overs").innerText = overs;
    document.getElementById("balls").innerText = balls;
    document.getElementById("batsmanOnStrike").innerText = batsmanOnStrike;
    document.getElementById("batsmanNonStrike").innerText = batsmanNonStrike;
    document.getElementById("extras").innerText = extras;
}

function appendTimeline(event, type) {
    const timeline = document.getElementById("timeline");
    const newBall = document.createElement("p");

    if (type === 'wkt') {
        newBall.classList.add("wktBall");
    } else if (type === 'extra') {
        newBall.classList.add("extraBall")
    } else {
        newBall.classList.add("eachBalls");
    }

    newBall.innerText = event; // ✅ Set text content correctly
    timeline.appendChild(newBall);
}


function scoreRun(runs) {
    const batPlayers = battingTeam === "team1" ? team1Players : team2Players;
    if (wickets[battingTeam] >= 10 || overs >= oversLimit) return;

    document.getElementById("wickets").innerText = wickets[battingTeam];
    totalScore += runs;
    balls++;

    let striker = playerStats[batsmanOnStrike];
    if (!striker)
        striker = playerStats[batsmanOnStrike] = {
            runs: 0,
            balls: 0,
            fours: 0,
            sixes: 0,
        };

    const bowlerStatsObj = bowlerStats[bowlingTeam];
    if (!bowlerStatsObj[currentBowler]) {
        bowlerStatsObj[currentBowler] = {
            balls: 0,
            overs: 0,
            runs: 0,
            wickets: 0
        };
    }

    striker.runs += runs;
    striker.balls++;
    if (runs === 4) striker.fours++;
    if (runs === 6) striker.sixes++;

    bowlerStatsObj[currentBowler].runs += runs;

    if (runs % 2 !== 0) {
        [batsmanOnStrike, batsmanNonStrike] = [batsmanNonStrike, batsmanOnStrike];
    }

    bowlerStatsObj[currentBowler].balls += 1;

    appendTimeline(runs, 'runs');

    if (balls >= 6) {
        overs++;
        document.getElementById("timeline").innerHTML = '';
        bowlerStatsObj[currentBowler].overs += 1;
        alert("Over's up!");
        balls = 0;
        [batsmanOnStrike, batsmanNonStrike] = [batsmanNonStrike, batsmanOnStrike];
    }

    updateScoreboard();

    if (overs >= oversLimit || wickets[battingTeam] === (batPlayers.length - 1) || (target !== -1 && totalScore > target)) {
        handleInningsEnd();
    }
}

function wicketFall() {
    const batPlayers = battingTeam === "team1" ? team1Players : team2Players;
    if (wickets[battingTeam] >= 10 || overs >= oversLimit) return;

    wickets[battingTeam]++;
    document.getElementById("wickets").innerText = wickets[battingTeam];
    balls++;

    const bowlerStatsObj = bowlerStats[bowlingTeam];

    if (!bowlerStatsObj[currentBowler]) {
        bowlerStatsObj[currentBowler] = {
            balls: 0,
            overs: 0,
            runs: 0,
            wickets: 0
        };
    }

    bowlerStats[bowlingTeam][currentBowler].wickets += 1;
    bowlerStatsObj[currentBowler].balls += 1;

    appendTimeline("W", 'wkt');

    if (currentBatIndex < batPlayers.length) {
        batsmanOnStrike = batPlayers[currentBatIndex++];
        playerStats[batsmanOnStrike] = { runs: 0, balls: 0, fours: 0, sixes: 0 };
    } else {
        alert("All out!");
    }

    if (balls >= 6) {
        overs++;
        bowlerStatsObj[currentBowler].overs += 1;
        document.getElementById("timeline").innerHTML = '';
        alert("Over's up!");
        balls = 0;
        [batsmanOnStrike, batsmanNonStrike] = [batsmanNonStrike, batsmanOnStrike];
    }

    updateScoreboard();

    if (wickets[battingTeam] === batPlayers.length - 1) {
        allout[battingTeam] = true;
        handleInningsEnd();
    }
}

function handleInningsEnd() {
    if (currentInnings === 1) {
        // Store first innings data
        matchData.firstInnings.players = { ...playerStats };
        matchData.firstInnings.bowlerStats = { ...bowlerStats[bowlingTeam] };
        matchData.firstInnings.wickets = wickets[battingTeam];
        matchData.firstInnings.extras = extras;
        matchData.firstInnings.overs = overs + (balls / 10);
        matchData.firstInnings.teamScore = totalScore;
        firstInningsScore = totalScore; // Store score of the first innings

        currentInnings = 2; // Change innings
        target = totalScore; // Set target for second innings

        // Switch teams for second innings
        [battingTeam, bowlingTeam] = [bowlingTeam, battingTeam];

        // Reset for second innings
        playerStats = {};
        bowlerStats = { team1: {}, team2: {} }; // Clear bowler stats for the second innings
        totalScore = 0;
        overs = 0;
        balls = 0;
        currentBatIndex = 2;
        document.getElementById("wickets").innerText = 0;
        extras = 0;
        document.getElementById("timeline").innerHTML = '';
        document.getElementById('target').innerText = target;
        document.getElementById("inningsDet").innerText = "2nd Innings";

        const batPlayers = battingTeam === "team1" ? team1Players : team2Players;
        batsmanOnStrike = batPlayers[0];
        batsmanNonStrike = batPlayers[1];
        wickets[battingTeam] = 0;

        playerStats[batsmanOnStrike] = { runs: 0, balls: 0, fours: 0, sixes: 0 };
        playerStats[batsmanNonStrike] = { runs: 0, balls: 0, fours: 0, sixes: 0 };


        // Update scoreboard for the second innings
        updateScoreboard();
        showBowlerDropdown();
        alert("Innings over! Second innings begins now.");
    } else {
        // Store second innings data
        matchData.secondInnings.players = { ...playerStats };
        matchData.secondInnings.bowlerStats = { ...bowlerStats[bowlingTeam] };
        matchData.secondInnings.wickets = wickets[battingTeam];
        matchData.secondInnings.extras = extras;
        matchData.secondInnings.overs = overs + (balls / 10);
        matchData.secondInnings.teamScore = totalScore;
        matchData.finalScore = totalScore;

        // Determine winner
        if (totalScore > firstInningsScore) {
            matchData.winner = `${matchData.secondInnings.teamName} won by ${totalWickets - wickets[battingTeam]}`;
        } else if (totalScore < firstInningsScore) {
            matchData.winner = `${matchData.firstInnings.teamName} won by ${matchData.firstInnings.teamScore - totalScore}`;
        } else {
            matchData.winner = "Its a Draw";
        }

        printMatchSummaryToConsole();

        // Hide scorecard container after match ends
        document.getElementsByClassName("scorecard-container")[0].style.display = "none";
    }
}


function wideBall(wExtra) {
    totalScore += 1;
    if (wExtra !== 0) {
        totalScore += wExtra;
        if (wExtra % 2 !== 0) {
            [batsmanOnStrike, batsmanNonStrike] = [batsmanNonStrike, batsmanOnStrike];
        }
    }

    appendTimeline(`w+${wExtra}`, 'extra');

    const bowlerStatsObj = bowlerStats[bowlingTeam];

    bowlerStatsObj[currentBowler].runs += wExtra + 1;

    if (!bowlerStatsObj[currentBowler]) {
        bowlerStatsObj[currentBowler] = {
            overs: 0,
            runs: 0,
            wickets: 0
        };
    }

    extras += wExtra + 1;

    updateScoreboard();
}

function noBall(wExtra) {
    totalScore += 1;
    if (wExtra !== 0) {
        totalScore += wExtra;
        if (wExtra % 2 !== 0) {
            [batsmanOnStrike, batsmanNonStrike] = [batsmanNonStrike, batsmanOnStrike];
        }
    }

    appendTimeline(`NB+${wExtra}`, 'extra');

    const bowlerStatsObj = bowlerStats[bowlingTeam];

    bowlerStatsObj[currentBowler].runs += wExtra + 1;

    if (!bowlerStatsObj[currentBowler]) {
        bowlerStatsObj[currentBowler] = {
            overs: 0,
            runs: 0,
            wickets: 0
        };
    }

    extras += wExtra + 1;

    updateScoreboard();
}


function finalScoreWicketCol(team, stats) {
    return allout[team] ? wickets[team] : Object.keys(stats).length - 1;
}

function printMatchSummaryToConsole(winnerName) {
    console.log("=== MATCH SUMMARY ===");

    console.log("First Innings:");
    if (matchData.firstInnings && matchData.firstInnings.players) {
        let totalFirst = 0;
        for (let player in matchData.firstInnings.players) {
            if (player) {
                const stats = matchData.firstInnings.players[player];
                totalFirst += stats.runs;
                console.log(`  ${player}: Runs: ${stats.runs}, Balls: ${stats.balls}, 4s: ${stats.fours}, 6s: ${stats.sixes}`);
            }
        }
        console.log(`  Team Score: ${totalFirst}/${matchData.firstInnings.wickets || 0}`);
        if (matchData.firstInnings.bowlerStats) {
            console.log("  Bowling:");
            for (let bowler in matchData.firstInnings.bowlerStats) {
                const b = matchData.firstInnings.bowlerStats[bowler];
                console.log(`    ${bowler}: Overs: ${b.overs}, Runs: ${b.runs}, Wickets: ${b.wickets}`);
            }
        }
    }

    console.log("Second Innings:");
    if (matchData.secondInnings && matchData.secondInnings.players) {
        let totalSecond = 0;
        for (let player in matchData.secondInnings.players) {
            if (player) {
                const stats = matchData.secondInnings.players[player];
                totalSecond += stats.runs;
                console.log(`  ${player}: Runs: ${stats.runs}, Balls: ${stats.balls}, 4s: ${stats.fours}, 6s: ${stats.sixes}`);
            }
        }
        console.log(`  Team Score: ${totalSecond}/${matchData.secondInnings.wickets || 0}`);
        if (matchData.secondInnings.bowlerStats) {
            console.log("  Bowling:");
            for (let bowler in matchData.secondInnings.bowlerStats) {
                const b = matchData.secondInnings.bowlerStats[bowler];
                console.log(`    ${bowler}: Overs: ${b.overs}, Runs: ${b.runs}, Wickets: ${b.wickets}`);
            }
        }
    }


    const team1Name = document.getElementById("team1-name").value;
    const team2Name = document.getElementById("team2-name").value;
    console.log(`Final Score: ${matchData.finalScore}`);
    console.log(matchData);

    fetch('/cricketHome/cricketPage', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            matchData: matchData
        })
    })
        .then(response => response.json())
        .then(data => {
            if (data.success && data.redirect) {
                window.location.href = data.redirect; // This actually redirects
            } else {
                console.error("Upload failed:", data.error);
            }
        })
        .catch(err => console.error("Fetch error:", err));
}
