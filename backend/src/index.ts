import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import type { Player, Capsule } from './schemas/serverObjectSchemas';
import capsuleObjects from './data/capsuleObjects.json';

export const app = express(); // create express server app
export const httpServer = createServer(app); // Express and Socket.io share this
app.use(cors()); // make app use cors middleware
app.use(express.json()); // enable request body parser

export const capsules: Capsule[] = capsuleObjects; // initialize array of capsules with capsule objects stored in json file
export const leaderboard = new Map<string, Player>(); // initialize array of players for leader
export let endsAt: number = 0; // create variable that has current live time plus five minutes
export function setEndsAt(val: number) {
  endsAt = val;
} // setter for tests

// export let gameDuration: number = 180000; // 3 minutes in ms
export let gameDuration: number = 180000;
export function setGameDuration(val: number) {
  gameDuration = val;
} // setter for tests

export let gameTimer: ReturnType<typeof setTimeout> | null = null; // tracks the game over timeout

const io = new Server(httpServer);

// Listen for client connections
io.on('connection', (socket) => {
  // Listens for the event of client sending message of the player opening a capsule
  socket.on('openCapsule', (playerId: string) => {
    if (Date.now() < endsAt) {
      const player = leaderboard.get(playerId);

      // if player is null, exit early
      if (!player) {
        return;
      } else if (player.capsules === 17) {
        return;
      }

      player.capsuleTimestamp = Date.now(); // record timestamp of player opening capsule
      player.capsules = player.capsules + 1; // increment player capsule count

      // Check if player won
      if (player.capsules === 17) {
        const msRemaining = endsAt - Date.now();
        const totalSeconds = Math.floor(msRemaining / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        player.completedAt = `${minutes}:${seconds.toString().padStart(2, '0')}`; // time remaining when they won
      }

      const updatedLeaderboard = Array.from(leaderboard.values()); // convert map of players to an array

      // sort the array
      const sortedPlayers = updatedLeaderboard.sort((playerA, playerB) => {
        if (playerB.capsules !== playerA.capsules) {
          return playerB.capsules - playerA.capsules;
        } else if (playerA.capsuleTimestamp === null && playerB.capsuleTimestamp === null) {
          return 0;
        } else if (playerA.capsuleTimestamp === null) {
          return 1;
        } else if (playerB.capsuleTimestamp === null) {
          return -1;
        }
        return playerA.capsuleTimestamp - playerB.capsuleTimestamp;
      });

      // assign the new rankings
      sortedPlayers.forEach((player, index) => {
        player.rank = index + 1;
      });
      // broadcast updated leaderboard to all clients
      io.emit('leaderboardUpdate', sortedPlayers);
    }
  });

  // HANDLE EVENT OF PLAYER LEAVING LOBBY WHICH CLOSES WEBSOCKET CONNECTION
  // WE WOULD WANT TO REMOVE THAT PLAYER THAT DISCONNECTED
});

// HTTP Endpoint: Starting the game and broadcasting that to all clients
app.post('/game/start', (req, res) => {
  endsAt = Date.now() + gameDuration; // runs JS method to get current time (12:30pm) in ms and adds game duration to get set end time for game

  // set timer for server to broadcast game over when time runs out
  gameTimer = setTimeout(() => {
    io.emit('gameOver'); // broadcast game ended
    const leaderboardArray = Array.from(leaderboard.values()); // convert leaderboard to an array
    io.emit('leaderboardUpdate', leaderboardArray); // broadcast leaderboard to all clients
  }, gameDuration);

  io.emit('gameStart', endsAt); // broadcast set end time (12:35pm) to all connect clients
  console.log('broadcasted webSocket!');
  const leaderboardArray = Array.from(leaderboard.values()); // convert leaderboard to an array
  io.emit('leaderboardUpdate', leaderboardArray); // broadcast leaderboard to all clients
  res.status(200).json({ message: 'Game Started' });
});

// HTTP Endpoint: Client getting array of all capsule objects from server
app.get('/capsules', (req, res) => {
  res.json(capsules); // send capsules array to client
});

// HTTP Endpoint: Client sends Player object for server to put in leaderboard array
app.post('/add/player', (req, res) => {
  const body = req.body; // parse request for its body object

  // Check if name sent is an acceptable username
  if (!body.name || typeof body.name !== 'string') {
    res.status(400).json({ error: 'Name must be a non-empty string' });
    return;
  }

  // need to update player w UUID:
  const newPlayer = {
    id: crypto.randomUUID(),
    name: body.name,
    capsules: 0,
    rank: leaderboard.size + 1,
    capsuleTimestamp: null,
    completedAt: null,
  };

  leaderboard.set(newPlayer.id, newPlayer); // add player object in request body to leaderboard array

  res.json(newPlayer); // return initial player state to client
});

const PORT = 3000;
if (process.env.NODE_ENV !== 'test') {
  httpServer.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`);
  });
}
