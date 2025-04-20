window.addEventListener("load", () => {
    const loader = document.querySelector(".loader-wrapper");
    
    // Trigger fade-out
    loader.style.opacity = "0";
    
    // Wait for the transition to complete before hiding
    setTimeout(() => {
        loader.style.visibility = "hidden";
    }, 500); // Match with your transition duration
});

const form = document.getElementById("create-form");
const noPlayerInput = document.getElementById("noOfPlayers");
const gameName = document.getElementById("gameName");
const teamAInputContainer = document.getElementById("teamA-players-input");
const teamBInputContainer = document.getElementById("teamB-players-input");

if (form && noPlayerInput && gameName && teamAInputContainer && teamBInputContainer) {
    window.noPlayerGet = function () {
        const nPlayers = parseInt(noPlayerInput.value);
        const gameNameInput = gameName.value.trim()
        if (isNaN(nPlayers) || nPlayers <= 0 || nPlayers % 2 !== 0) {
            alert("Enter a valid even number of players");
            return;
        } if (nPlayers > 22) {
            alert("Enter a valid number of players, they should not exceed 22");
            return;
        } if (gameNameInput === "") {
            alert("Enter a game name");
            return;
        }

        fetch('/footballHome/footballCreate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                gn: gameNameInput
            })
        })
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    alert("Game name already exists! Please choose another.");
                    return;
                }

                document.getElementById("nameOfTheGame").textContent = gameNameInput;


                document.getElementById("noPlayers").style.display = "none";
                form.style.display = "block";

                teamAInputContainer.innerHTML = "";
                teamBInputContainer.innerHTML = "";

                for (let i = 1; i <= nPlayers / 2; i++) {
                    teamAInputContainer.innerHTML += `<input type="text" placeholder="Team A Player ${i}" required><br>`;
                    teamBInputContainer.innerHTML += `<input type="text" placeholder="Team B Player ${i}" required><br>`;
                }
            })

        form.addEventListener("submit", function (e) {
            e.preventDefault();

            const gameNameInput = gameName.value.trim();
            const teamAName = document.getElementById("teamA-name").value.trim();
            const teamBName = document.getElementById("teamB-name").value.trim();

            const teamAInputs = teamAInputContainer.querySelectorAll("input");
            const teamBInputs = teamBInputContainer.querySelectorAll("input");

            const teamAPlayers = Array.from(teamAInputs).map(input => input.value.trim());
            const teamBPlayers = Array.from(teamBInputs).map(input => input.value.trim());

            if (teamAPlayers.includes("") || teamBPlayers.includes("")) {
                alert("All player fields must be filled!");
                return;
            }

            localStorage.setItem("GameName", gameNameInput);
            localStorage.setItem("teamAName", teamAName);
            localStorage.setItem("teamBName", teamBName);
            localStorage.setItem("teamAPlayers", JSON.stringify(teamAPlayers));
            localStorage.setItem("teamBPlayers", JSON.stringify(teamBPlayers));

            console.log("Form submitted, redirecting...");
            window.location.href = "/footballHome/footballPage";
        });

    }
}

window.addEventListener("load", () => {
    const loader = document.querySelector(".loader-wrapper");
    
    // Trigger fade-out
    loader.style.opacity = "0";
    
    // Wait for the transition to complete before hiding
    setTimeout(() => {
        loader.style.visibility = "hidden";
    }, 500); // Match with your transition duration
});

let timerInterval;
let seconds = 0;
let minutes = 0;
let maxMinutes = 90;
let matchDuration = 90;
let firstHalf = 45;
let secondHalf = 45;
let currentHalf = "1st Half";
let isRunning = false;

const gn = localStorage.getItem("GameName");
const teamA = { name: "Team A", score: 0, players: [], goalScorers: [], redCardPlayers: [] };
const teamB = { name: "Team B", score: 0, players: [], goalScorers: [], redCardPlayers: [] };

function setMatchDuration() {
    const input = document.getElementById("match-duration");
    const value = parseInt(input.value);
    if (!isNaN(value) && value > 0) {
        matchDuration = value;
        firstHalf = Math.floor(matchDuration / 2);
        secondHalf = matchDuration - firstHalf;
        halfBoundary = firstHalf;  // ✅ Define this before calling updateHalfInfo
        currentHalf = "1st Half";
        updateHalfInfo();
        resetTimer();

        const container = document.getElementsByClassName("container")[0];
        const duration = document.getElementsByClassName("duration")[0];
        if (container && duration) {
            container.style.display = "block";
            duration.style.display = "none";
        }
    }
}


function updateHalfInfo() {
    const halftime = document.getElementById("half-time");
    const halfname = document.getElementById("half-name");
    if (minutes >= halfBoundary) {
        currentHalf = "2nd Half";
        halfname.textContent = `${currentHalf}`;
        halftime.textContent = `(${matchDuration})`;
    } else {
        currentHalf = "1st Half";
        halfname.textContent = `${currentHalf}`;
        halftime.textContent = `(${matchDuration - halfBoundary})`;
    }
}


function endMatch() {
    clearInterval(timerInterval);
    isRunning = false;

    document.getElementById("end-btn").style.display = "none";
    document.getElementById("end-message").textContent = "🏁 Match Over!";

    // Disable timer & stat buttons
    const allButtons = document.querySelectorAll("button");
    allButtons.forEach(btn => {
        if (!btn.classList.contains("no-disable")) {
            btn.disabled = true;
        }
    });

    // 1. MATCH SUMMARY
    const matchSummary = {
        gameName: gn,
        teamA: teamA.name,
        teamB: teamB.name,
        score: {
            teamA: teamA.score,
            teamB: teamB.score
        },
        duration: matchDuration,
        endTime: `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`
    };

    // 2. TEAM A EVENTS
    const teamAEvents = {
        team: teamA.name,
        players: teamA.players.map(p => ({
            name: p.name,
            goals: p.goals,
            assists: p.assists,
            yellowCards: p.yellowCards,
            redCards: p.redCards
        })),
        events: [
            ...teamA.goalScorers,
            ...teamA.redCardPlayers
        ]
    };

    // 3. TEAM B EVENTS
    const teamBEvents = {
        team: teamB.name,
        players: teamB.players.map(p => ({
            name: p.name,
            goals: p.goals,
            assists: p.assists,
            yellowCards: p.yellowCards,
            redCards: p.redCards
        })),
        events: [
            ...teamB.goalScorers,
            ...teamB.redCardPlayers
        ]
    };

    // 4. ALL EVENTS MERGED IN ORDER
    function extractTime(eventStr) {
        const match = eventStr.match(/\d+:\d+/);
        return match ? match[0] : "00:00";
    }

    const allEvents = [
        ...teamA.goalScorers.map(e => ({ text: e, team: teamA.name })),
        ...teamA.redCardPlayers.map(e => ({ text: e, team: teamA.name })),
        ...teamB.goalScorers.map(e => ({ text: e, team: teamB.name })),
        ...teamB.redCardPlayers.map(e => ({ text: e, team: teamB.name }))
    ];

    const allMatchEvents = allEvents
        .map(e => ({
            text: e.text,
            time: extractTime(e.text),
            team: e.team
        }))
        .sort((a, b) => {
            const [minA, secA] = a.time.split(":").map(Number);
            const [minB, secB] = b.time.split(":").map(Number);
            return minA * 60 + secA - (minB * 60 + secB);
        })
        .map(e => `${e.time} - ${e.text.replace(` at ${e.time}`, "")} (${e.team})`);

    // 👉 Now you have 4 JSONs: matchSummary, teamAEvents, teamBEvents, allMatchEvents
    console.log("📊 Match Summary:", matchSummary);
    console.log("🎯 Team A Events:", teamAEvents);
    console.log("🎯 Team B Events:", teamBEvents);

    fetch('/footballHome/footballPage', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            matchSummary: matchSummary,
            teamAEvents: teamAEvents,
            teamBEvents: teamBEvents,
            allMatchEvents: allMatchEvents
        })
    })
        .then(res => res.json())
        .then(data => {
            if (data.success && data.redirect) {
                window.location.href = data.redirect;
            } else {
                console.error("Football upload failed:", data.error);
            }
        })
        .catch(err => console.error("Error:", err));
    // Optionally save them to localStorage or download as files
    localStorage.setItem("matchSummary", JSON.stringify(matchSummary));
    localStorage.setItem("teamAEvents", JSON.stringify(teamAEvents));
    localStorage.setItem("teamBEvents", JSON.stringify(teamBEvents));
    localStorage.setItem("allMatchEvents", JSON.stringify(allMatchEvents));
}


function updateTimerDisplay() {
    const timer = document.getElementById("timer");

    updateHalfInfo();

    if (minutes >= matchDuration) {
        clearInterval(timerInterval);
        document.getElementById("end-btn").style.display = "inline-block";
    }


    if (timer) {
        timer.textContent = `${minutes < 10 ? "0" : ""}${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
    }
}

function startTimer() {
    if (!isRunning) {
        isRunning = true;
        timerInterval = setInterval(() => {
            seconds++;
            if (seconds === 60) {
                seconds = 0;
                minutes++;
            }
            if (minutes >= maxMinutes) {
                clearInterval(timerInterval);
                alert("The match has ended!");
            }
            updateTimerDisplay();
        }, 1000);
    }
}

function pauseTimer() {
    clearInterval(timerInterval);
    isRunning = false;
}

function resetTimer() {
    clearInterval(timerInterval);
    isRunning = false;
    seconds = 0;
    minutes = 0;
    updateTimerDisplay();
}

function toggleDetails(id) {
    let details = document.getElementById(id);
    if (details) {
        details.style.display = details.style.display === "block" ? "none" : "block";
    }
}

function updateStat(teamId, playerIndex, stat) {
    let team = teamId === "teamA-players" ? teamA : teamB;
    let player = team.players[playerIndex - 1];
    if (!player) return;

    if (player.redCards > 0 && stat !== "redCards") {
        alert(`${player.name} is sent off and cannot receive any more cards!`);
        return;
    }

    if (stat === "yellowCards") {
        player.yellowCards++;
        document.getElementById(`${teamId}-player${playerIndex}-yellow`).textContent = player.yellowCards;
        team.goalScorers.push(`${player.name} 🟨 at ${minutes}:${seconds < 10 ? '0' : ''}${seconds}`);
        updateGoalScorers(team);

        if (player.yellowCards === 2) {
            player.redCards++;
            document.getElementById(`${teamId}-player${playerIndex}-red`).textContent = player.redCards;
            team.goalScorers.push(`${player.name} 🟥 sent off at ${minutes}:${seconds < 10 ? '0' : ''}${seconds}`);
            updateGoalScorers(team);
        }
    }

    if (stat === "redCards") {
        player.redCards++;
        document.getElementById(`${teamId}-player${playerIndex}-red`).textContent = player.redCards;
        team.goalScorers.push(`${player.name} 🟥 sent off at ${minutes}:${seconds < 10 ? '0' : ''}${seconds}`);
        updateGoalScorers(team);
    }

    if (stat === "goals") {
        player.goals++;
        team.score++;
        document.getElementById(`${teamId === "teamA-players" ? "teamA-score" : "teamB-score"}`).textContent = team.score;
        document.getElementById(`${teamId}-player${playerIndex}-goals`).textContent = player.goals;
        let currentTime = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
        team.goalScorers.push(`${player.name} ⚽ at ${currentTime}`);
        updateGoalScorers(team);
    }

    if (stat === "assists") {
        player.assists++;
        document.getElementById(`${teamId}-player${playerIndex}-assists`).textContent = player.assists;
        let currentTime = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
        team.goalScorers.push(`${player.name} 🎯 at ${currentTime}`);
        updateGoalScorers(team);
    }
}

function decreaseStat(teamId, playerIndex, stat) {
    let team = teamId === "teamA-players" ? teamA : teamB;
    let player = team.players[playerIndex - 1];
    if (!player || player[stat] === 0) return;

    if (stat === "yellowCards") {
        player.yellowCards--;
        document.getElementById(`${teamId}-player${playerIndex}-yellow`).textContent = player.yellowCards;
        team.goalScorers.pop();
        updateGoalScorers(team);
    }

    if (stat === "redCards") {
        player.redCards--;
        document.getElementById(`${teamId}-player${playerIndex}-red`).textContent = player.redCards;
        team.goalScorers.pop();
        updateGoalScorers(team);
    }

    if (stat === "goals") {
        player.goals--;
        team.score = Math.max(0, team.score - 1);
        document.getElementById(`${teamId}-player${playerIndex}-goals`).textContent = player.goals;
        document.getElementById(`${teamId === "teamA-players" ? "teamA-score" : "teamB-score"}`).textContent = team.score;
        team.goalScorers.pop();
        updateGoalScorers(team);
    }

    if (stat === "assists") {
        player.assists--;
        document.getElementById(`${teamId}-player${playerIndex}-assists`).textContent = player.assists;
        team.goalScorers.pop();
        updateGoalScorers(team);
    }
}

function updateGoalScorers(team) {
    let container = document.getElementById(`${team === teamA ? "teamA" : "teamB"}-keyevents`);
    if (container) {
        container.innerHTML = "";
        team.goalScorers.forEach(goal => {
            let goalDiv = document.createElement("div");
            goalDiv.classList.add("goal-scorer");
            goalDiv.innerHTML = `
                <span class="goal-scorer-name">${goal.split(" at")[0]}</span>
                <span class="goal-scorer-at"> at </span>
                <span class="goal-time">${goal.split("at ")[1]}</span>
            `;
            container.appendChild(goalDiv);
        });
    }
}



function createPlayers(team, teamId, players) {
    let container = document.getElementById(teamId);
    if (!container) return;

    players.forEach((playerName, index) => {
        if (playerName && playerName.trim() !== "") {
            let player = {
                name: playerName,
                goals: 0,
                assists: 0,
                yellowCards: 0,
                redCards: 0
            };
            team.players.push(player);
            let playerDiv = document.createElement("div");
            playerDiv.classList.add("player-card");
            playerDiv.innerHTML = `
                <div class="player-header" onclick="toggleDetails('${teamId}-player${index + 1}-details')">
                    <h3>${player.name}</h3>
                </div>
                <div class="player-details" id="${teamId}-player${index + 1}-details">
                    <p class="stats">⚽ Goals: <span id="${teamId}-player${index + 1}-goals">0</span></p>
                    <p class="stats">🎯 Assists: <span id="${teamId}-player${index + 1}-assists">0</span></p>
                    <p class="stats">🟨 Yellow Cards: <span id="${teamId}-player${index + 1}-yellow">0</span></p>
                    <p class="stats">🟥 Red Cards: <span id="${teamId}-player${index + 1}-red">0</span></p>
                    
                    <div class="updateBtns">
                    <button class="btn add btn-goal" onclick="updateStat('${teamId}', ${index + 1}, 'goals')">+</button>
                    <span class="uBtn goal">Goal</span>
                    <button class="btn sub btn-goal" onclick="decreaseStat('${teamId}', ${index + 1}, 'goals')">−</button>
                    </div>

                    <div class="updateBtns">
                    <button class="btn add btn-assist" onclick="updateStat('${teamId}', ${index + 1}, 'assists')">+</button>
                    <span class="uBtn assist">Assist</span>
                    <button class="btn sub btn-assist" onclick="decreaseStat('${teamId}', ${index + 1}, 'assists')">−</button>
                    </div>

                    <div class="updateBtns">
                    <button class="btn add btn-yellow" onclick="updateStat('${teamId}', ${index + 1}, 'yellowCards')">+</button>
                    <span class="uBtn yellow">Yellow</span>
                    <button class="btn sub btn-yellow" onclick="decreaseStat('${teamId}', ${index + 1}, 'yellowCards')">−</button>
                    </div>

                    <div class="updateBtns">
                    <button class="btn add btn-red" onclick="updateStat('${teamId}', ${index + 1}, 'redCards')">+</button>
                    <span class="uBtn yellow">Red</span>
                    <button class="btn sub btn-red" onclick="decreaseStat('${teamId}', ${index + 1}, 'redCards')">−</button>
                    </div>
                </div>
            `;
            container.appendChild(playerDiv);
        }
    });
}

const teamAContainer = document.getElementById("teamA-players");
const teamBContainer = document.getElementById("teamB-players");

if (teamAContainer && teamBContainer) {
    const teamAPlayers = JSON.parse(localStorage.getItem("teamAPlayers") || "[]");
    const teamBPlayers = JSON.parse(localStorage.getItem("teamBPlayers") || "[]");
    const teamAName = localStorage.getItem("teamAName") || "Team A";
    const teamBName = localStorage.getItem("teamBName") || "Team B";
    const gameName = localStorage.getItem("GameName");

    // Update DOM
    document.getElementById("nameOfGame").textContent = gameName;

    document.getElementById("teamA-name").textContent = teamAName;
    document.getElementById("teamB-name").textContent = teamBName;

    document.getElementById("teamAname").innerHTML = `${teamAName} Players`;
    document.getElementById("teamBname").innerHTML = `${teamBName} Players`;

    teamA.name = teamAName;
    teamB.name = teamBName;

    createPlayers(teamA, "teamA-players", teamAPlayers);
    createPlayers(teamB, "teamB-players", teamBPlayers);
}