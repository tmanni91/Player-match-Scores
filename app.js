const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const databasePath = path.join(__dirname, "cricketMatchDetails.db");

const app = express();

app.use(express.json());

let database = null;

const initializeDbAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () =>
      console.log("Server Running at http://localhost:3000/")
    );
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

const convertDbObjectToResponseObject = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  };
};

const convertDbObjectToResponseObject1 = (dbObject1) => {
  return {
    matchId: dbObject1.match_id,
    match: dbObject1.match,
    year: dbObject1.year,
  };
};

const convertDbObjectToResponseObject2 = (dbObject2) => {
  return {
    playerMatchId: dbObject2.player_match_id,
    playerMatchId: dbObject2.player_match_id,
    matchId: dbObject2.match_id,
    score: dbObject2.score,
    fours: dbObject2.fours,
    sixes: dbObject2.sixes,
  };
};

// API 1

app.get("/players/", async (request, response) => {
  const getPlayersQuery = `
    SELECT
      *
    FROM
      player_details;`;
  const playersArray = await database.all(getPlayersQuery);
  response.send(
    playersArray.map((eachPlayer) =>
      convertDbObjectToResponseObject(eachPlayer)
    )
  );
});

//API 2

app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerQuery = `
    SELECT 
      * 
    FROM 
      player_details 
    WHERE 
      player_id = ${playerId};`;
  const player = await database.get(getPlayerQuery);
  response.send(convertDbObjectToResponseObject(player));
});

// API 3

app.put("/players/:playerId/", async (request, response) => {
  const { playerName } = request.body;
  const { playerId } = request.params;
  const updatePlayerQuery = `
  UPDATE
    player_details
  SET
    player_name = '${playerName}'
  WHERE
    player_id = ${playerId};`;

  await database.run(updatePlayerQuery);
  response.send("Player Details Updated");
});

// API 4

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchQuery = `
    SELECT 
      * 
    FROM 
      match_details 
    WHERE 
      match_id = ${matchId};`;
  const match = await database.get(getMatchQuery);
  response.send(convertDbObjectToResponseObject1(match));
});

// API 5

app.get("/players/:playerId/matches/", async (request, response) => {
  const { playerId } = request.params;
  const sqlQuery = `
    SELECT match_id AS matchId,
           match,
           year 
    FROM player_match_score NATURAL JOIN match_details
    WHERE player_id = '${playerId}';    `;
  const dbResult = await database.all(sqlQuery);
  response.send(dbResult);
  console.log(dbResult);
});

// API 6

app.get("/matches/:matchId/players/", async (request, response) => {
  const { matchId } = request.params;
  sqlGetQuery = `
    SELECT player_id as playerId,
           player_name as playerName 
    FROM player_details NATURAL JOIN player_match_score
    WHERE match_id = '${matchId}';    `;
  const dbResult = await database.all(sqlGetQuery);
  response.send(dbResult);
  console.log(dbResult);
});

// API 7

app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerScoresQuery = `
    SELECT 
      player_details.player_id AS player_id,
      player_details.player_name AS player_name,
      SUM(player_match_score.score) AS total_score,
      SUM(player_match_score.fours) AS total_fours,
      SUM(player_match_score.sixes) AS total_sixes
    FROM 
      player_details INNER JOIN player_match_score ON 
      player_details.player_id = player_match_score.player_id 
    WHERE 
      player_details.player_id = ${playerId};`;
  const playerScores = await database.get(getPlayerScoresQuery);
  //   console.log(playerScores);
  response.send({
    playerId: playerScores["player_id"],
    playerName: playerScores["player_name"],
    totalScore: playerScores["total_score"],
    totalFours: playerScores["total_fours"],
    totalSixes: playerScores["total_sixes"],
  });
});

module.exports = app;
