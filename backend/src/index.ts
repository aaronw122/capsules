import express from 'express';
import cors from 'cors';
import type { Player, Capsule } from './schemas/serverObjectSchemas';

export const app = express(); // create express server app
app.use(cors()); // make app use cors middleware
app.use(express.json()); // enable request body parser

const capsules: Capsule[] = []; // initialize array of capsules
const leaderboard: Player[] = []; // initialize array of players for leader
// create object position json here

// HTTP Endpoint: Client getting array of all capsule objects from server
app.get('/capsules', (req, res) => {
  res.json(capsules); // send response of capsules array to client
});

// HTTP Endpoint: Client sends Player object for server to put in leaderboard array
app.post('/add/player', (req, res) => {
  const body = req.body; // parse request for its body object

  //need to update player w UUID:

  const newPlayer = {
    id: crypto.randomUUID(),
    name: body.name,
    capsules: 0,
    completedAt: null,
    place: leaderboard.length + 1,
  };

  leaderboard.push(newPlayer); // add player object in request body to leaderboard array

  // COMMENT: WHEN WEBSOCKETS ARE MADE, BROADCAST NEW STATE OF LEADERBOARD EVERYTIME LEADERBOARD GETS UPDATED
  console.log('player', newPlayer);

  console.log('leaderboard', leaderboard);

  res.json(newPlayer);
});

const PORT = 3000;
app.listen(PORT, (err) => {
  if (err) {
    console.log('Error on server setup', err);
  } else {
    console.log(`Listening on port ${PORT}`);
  }
});
