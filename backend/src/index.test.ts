import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'bun:test';
import request from 'supertest';
import { io as ioc, type Socket as ClientSocket } from 'socket.io-client';
import { app, httpServer, leaderboard, setEndsAt, setGameDuration, gameTimer } from './index';

const TEST_PORT = 3001;
let serverUrl: string;

beforeAll((done) => {
  httpServer.listen(TEST_PORT, () => {
    serverUrl = `http://localhost:${TEST_PORT}`;
    done();
  });
});

afterAll((done) => {
  httpServer.close(() => done());
});

beforeEach(() => {
  leaderboard.clear();
  setEndsAt(0);
  setGameDuration(300000); // reset to default 5min
  if (gameTimer) clearTimeout(gameTimer); // clear any pending game over timers from previous tests
});

// Helper: create a socket client connected to the test server
function createClient(): Promise<ClientSocket> {
  return new Promise((resolve) => {
    const client = ioc(serverUrl, { forceNew: true });
    client.on('connect', () => resolve(client));
  });
}

// Helper: add a player via HTTP and return the player object
async function addPlayer(name: string) {
  const res = await request(app).post('/add/player').send({ name });
  return res.body;
}

// Helper: start the game and consume the initial leaderboardUpdate broadcast
// so subsequent listeners only catch openCapsule-triggered updates
async function startGame(client: ClientSocket) {
  const initialLbPromise = new Promise<void>((resolve) => {
    client.once('leaderboardUpdate', () => resolve());
  });
  await request(app).post('/game/start');
  await initialLbPromise;
}

// ==================== HTTP ENDPOINT TESTS ====================

describe('GET /capsules', () => {
  it('should return the array of capsule objects', async () => {
    const res = await request(app).get('/capsules');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(17);
  });

  it('each capsule should have the correct shape', async () => {
    const res = await request(app).get('/capsules');
    const capsule = res.body[0];
    expect(capsule).toHaveProperty('id');
    expect(capsule).toHaveProperty('letter');
    expect(capsule).toHaveProperty('number');
    expect(capsule).toHaveProperty('isOpened');
    expect(capsule).toHaveProperty('position');
    expect(capsule).toHaveProperty('content');
    expect(capsule.content).toHaveProperty('name');
    expect(capsule.content).toHaveProperty('funFact');
  });
});

describe('POST /add/player', () => {
  it('should create a player with correct default values', async () => {
    const res = await request(app).post('/add/player').send({ name: 'Alice' });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Alice');
    expect(res.body.capsules).toBe(0);
    expect(res.body.rank).toBe(1);
    expect(res.body.capsuleTimestamp).toBeNull();
    expect(res.body.completedAt).toBeNull();
    expect(res.body.id).toBeDefined();
  });

  it('should assign a UUID as the player id', async () => {
    const res = await request(app).post('/add/player').send({ name: 'Bob' });
    // UUID v4 format check
    expect(res.body.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
  });

  it('should increment rank for each new player', async () => {
    const res1 = await request(app).post('/add/player').send({ name: 'Alice' });
    const res2 = await request(app).post('/add/player').send({ name: 'Bob' });
    const res3 = await request(app).post('/add/player').send({ name: 'Charlie' });
    expect(res1.body.rank).toBe(1);
    expect(res2.body.rank).toBe(2);
    expect(res3.body.rank).toBe(3);
  });

  it('should add the player to the leaderboard map', async () => {
    const res = await request(app).post('/add/player').send({ name: 'Dave' });
    expect(leaderboard.has(res.body.id)).toBe(true);
  });
});

describe('POST /game/start', () => {
  it('should return 200 with Game Started message', async () => {
    const res = await request(app).post('/game/start');
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Game Started');
  });

  it('should broadcast gameStart event with endsAt timestamp to connected clients', async () => {
    const client = await createClient();

    const gameStartPromise = new Promise<number>((resolve) => {
      client.on('gameStart', (endsAt: number) => resolve(endsAt));
    });

    await request(app).post('/game/start');
    const endsAt = await gameStartPromise;

    expect(endsAt).toBeGreaterThan(Date.now() - 1000); // should be roughly now + 5min
    expect(endsAt).toBeLessThanOrEqual(Date.now() + 300000 + 1000);

    client.disconnect();
  });

  it('should broadcast the leaderboard when game starts', async () => {
    await addPlayer('Alice');
    await addPlayer('Bob');

    const client = await createClient();

    const leaderboardPromise = new Promise<any[]>((resolve) => {
      client.on('leaderboardUpdate', (lb: any[]) => resolve(lb));
    });

    await request(app).post('/game/start');
    const lb = await leaderboardPromise;

    expect(lb.length).toBe(2);
    expect(lb.map((p: any) => p.name).sort()).toEqual(['Alice', 'Bob']);

    client.disconnect();
  });

  it('should broadcast gameOver and final leaderboard when timer expires', async () => {
    setGameDuration(200); // 200ms for testing instead of 5 minutes

    await addPlayer('Alice');
    await addPlayer('Bob');

    const client = await createClient();

    const gameOverPromise = new Promise<void>((resolve) => {
      client.on('gameOver', () => resolve());
    });

    // Start game and consume the initial leaderboardUpdate
    await startGame(client);

    // Now listen for the final leaderboard from the gameOver timer
    const finalLeaderboardPromise = new Promise<any[]>((resolve) => {
      client.on('leaderboardUpdate', (lb: any[]) => resolve(lb));
    });

    // Wait for the short timer to fire
    await gameOverPromise;
    const lb = await finalLeaderboardPromise;

    expect(lb.length).toBe(2);

    client.disconnect();
  });
});

// ==================== WEBSOCKET EVENT TESTS ====================

describe('openCapsule event', () => {
  it('should increment player capsule count', async () => {
    const player = await addPlayer('Alice');
    const client = await createClient();

    // Start the game and consume initial leaderboard broadcast
    await startGame(client);

    const leaderboardPromise = new Promise<any[]>((resolve) => {
      client.on('leaderboardUpdate', (lb: any[]) => resolve(lb));
    });

    client.emit('openCapsule', player.id);
    const lb = await leaderboardPromise;

    const updatedPlayer = lb.find((p: any) => p.id === player.id);
    expect(updatedPlayer.capsules).toBe(1);
    expect(updatedPlayer.capsuleTimestamp).toBeDefined();
    expect(updatedPlayer.capsuleTimestamp).not.toBeNull();

    client.disconnect();
  });

  it('should sort players by capsule count (most first)', async () => {
    const alice = await addPlayer('Alice');
    const bob = await addPlayer('Bob');
    const client = await createClient();

    await startGame(client);

    // Alice opens 2 capsules, Bob opens 1
    let lastLb: any[];

    // Alice opens capsule 1
    await new Promise<void>((resolve) => {
      client.once('leaderboardUpdate', () => resolve());
      client.emit('openCapsule', alice.id);
    });

    // Alice opens capsule 2
    await new Promise<void>((resolve) => {
      client.once('leaderboardUpdate', () => resolve());
      client.emit('openCapsule', alice.id);
    });

    // Bob opens capsule 1
    await new Promise<void>((resolve) => {
      client.once('leaderboardUpdate', (lb: any[]) => {
        lastLb = lb;
        resolve();
      });
      client.emit('openCapsule', bob.id);
    });

    // Alice (2 capsules) should rank higher than Bob (1 capsule)
    expect(lastLb![0].name).toBe('Alice');
    expect(lastLb![0].rank).toBe(1);
    expect(lastLb![1].name).toBe('Bob');
    expect(lastLb![1].rank).toBe(2);

    client.disconnect();
  });

  it('should rank by earlier timestamp when capsule counts are tied', async () => {
    const alice = await addPlayer('Alice');
    const bob = await addPlayer('Bob');
    const client = await createClient();

    await startGame(client);

    // Alice opens first
    await new Promise<void>((resolve) => {
      client.once('leaderboardUpdate', () => resolve());
      client.emit('openCapsule', alice.id);
    });

    // Small delay so timestamps differ
    await new Promise((r) => setTimeout(r, 10));

    // Bob opens second
    let lastLb: any[];
    await new Promise<void>((resolve) => {
      client.once('leaderboardUpdate', (lb: any[]) => {
        lastLb = lb;
        resolve();
      });
      client.emit('openCapsule', bob.id);
    });

    // Both have 1 capsule, but Alice opened first
    expect(lastLb![0].name).toBe('Alice');
    expect(lastLb![0].rank).toBe(1);
    expect(lastLb![1].name).toBe('Bob');
    expect(lastLb![1].rank).toBe(2);

    client.disconnect();
  });

  it('should not process openCapsule before game starts', async () => {
    const player = await addPlayer('Alice');
    const client = await createClient();

    let received = false;
    client.on('leaderboardUpdate', () => {
      received = true;
    });

    client.emit('openCapsule', player.id);

    // Wait a bit to see if anything comes through
    await new Promise((r) => setTimeout(r, 200));
    expect(received).toBe(false);

    // Verify capsule count didn't change
    expect(leaderboard.get(player.id)!.capsules).toBe(0);

    client.disconnect();
  });

  it('should not process openCapsule after game ends', async () => {
    const player = await addPlayer('Alice');
    const client = await createClient();

    // Set endsAt to the past (game already over)
    setEndsAt(Date.now() - 1000);

    let received = false;
    client.on('leaderboardUpdate', () => {
      received = true;
    });

    client.emit('openCapsule', player.id);

    await new Promise((r) => setTimeout(r, 200));
    expect(received).toBe(false);
    expect(leaderboard.get(player.id)!.capsules).toBe(0);

    client.disconnect();
  });

  it('should ignore openCapsule for invalid player id', async () => {
    const client = await createClient();

    await startGame(client);

    let received = false;
    client.on('leaderboardUpdate', () => {
      received = true;
    });

    client.emit('openCapsule', 'fake-id-does-not-exist');

    await new Promise((r) => setTimeout(r, 200));
    expect(received).toBe(false);

    client.disconnect();
  });

  it('should set completedAt when player reaches 17 capsules', async () => {
    const player = await addPlayer('Alice');
    const client = await createClient();

    await startGame(client);

    // Open 17 capsules
    for (let i = 0; i < 17; i++) {
      await new Promise<void>((resolve) => {
        client.once('leaderboardUpdate', () => resolve());
        client.emit('openCapsule', player.id);
      });
    }

    const finalPlayer = leaderboard.get(player.id)!;
    expect(finalPlayer.capsules).toBe(17);
    expect(finalPlayer.completedAt).not.toBeNull();
    expect(finalPlayer.completedAt).toBeGreaterThan(0);

    client.disconnect();
  });

  it('should not increment capsules beyond 17', async () => {
    const player = await addPlayer('Alice');
    const client = await createClient();

    await startGame(client);

    // Open 17 capsules
    for (let i = 0; i < 17; i++) {
      await new Promise<void>((resolve) => {
        client.once('leaderboardUpdate', () => resolve());
        client.emit('openCapsule', player.id);
      });
    }

    // Try to open an 18th
    let received = false;
    client.on('leaderboardUpdate', () => {
      received = true;
    });
    client.emit('openCapsule', player.id);

    await new Promise((r) => setTimeout(r, 200));
    expect(received).toBe(false);
    expect(leaderboard.get(player.id)!.capsules).toBe(17);

    client.disconnect();
  });

  it('should broadcast leaderboardUpdate to all connected clients', async () => {
    const player = await addPlayer('Alice');
    const client1 = await createClient();
    const client2 = await createClient();

    // Start game and consume initial broadcast on both clients
    const initialLb1 = new Promise<void>((resolve) => {
      client1.once('leaderboardUpdate', () => resolve());
    });
    const initialLb2 = new Promise<void>((resolve) => {
      client2.once('leaderboardUpdate', () => resolve());
    });
    await request(app).post('/game/start');
    await Promise.all([initialLb1, initialLb2]);

    const promise1 = new Promise<any[]>((resolve) => {
      client1.on('leaderboardUpdate', (lb: any[]) => resolve(lb));
    });
    const promise2 = new Promise<any[]>((resolve) => {
      client2.on('leaderboardUpdate', (lb: any[]) => resolve(lb));
    });

    client1.emit('openCapsule', player.id);

    const [lb1, lb2] = await Promise.all([promise1, promise2]);

    expect(lb1.length).toBe(1);
    expect(lb2.length).toBe(1);
    expect(lb1[0].capsules).toBe(1);
    expect(lb2[0].capsules).toBe(1);

    client1.disconnect();
    client2.disconnect();
  });

  it('should correctly rank 17 players with varied capsule counts', async () => {
    // Create 17 players
    const playerNames = [
      'Alice',
      'Bob',
      'Charlie',
      'Dave',
      'Eve',
      'Frank',
      'Grace',
      'Hank',
      'Ivy',
      'Jake',
      'Karen',
      'Leo',
      'Mia',
      'Nick',
      'Olivia',
      'Paul',
      'Quinn',
    ];
    const players: {
      id: string;
      name: string;
      capsules: number;
      rank: number;
      capsuleTimestamp: number | null;
      completedAt: number | null;
    }[] = [];
    for (const name of playerNames) {
      players.push(await addPlayer(name));
    }

    const client = await createClient();
    await startGame(client);

    // Give each player a different number of capsules opened:
    // Alice: 15, Bob: 3, Charlie: 10, Dave: 7, Eve: 17 (winner),
    // Frank: 0, Grace: 12, Hank: 5, Ivy: 1, Jake: 8,
    // Karen: 10 (tied with Charlie), Leo: 14, Mia: 6, Nick: 2,
    // Olivia: 9, Paul: 11, Quinn: 4
    const capsuleCounts = [15, 3, 10, 7, 17, 0, 12, 5, 1, 8, 10, 14, 6, 2, 9, 11, 4];

    // Open capsules for each player sequentially
    for (let i = 0; i < players.length; i++) {
      for (let c = 0; c < capsuleCounts[i]!; c++) {
        await new Promise<void>((resolve) => {
          client.once('leaderboardUpdate', () => resolve());
          client.emit('openCapsule', players[i]!.id);
        });
        // Small delay between different players' capsules to create distinct timestamps
        if (c === capsuleCounts[i]! - 1 && i < players.length - 1) {
          await new Promise((r) => setTimeout(r, 5));
        }
      }
    }

    // Get final leaderboard state from the map
    const finalLb = Array.from(leaderboard.values());
    const sorted = finalLb.sort((a, b) => {
      if (b.capsules !== a.capsules) return b.capsules - a.capsules;
      if (a.capsuleTimestamp === null && b.capsuleTimestamp === null) return 0;
      if (a.capsuleTimestamp === null) return 1;
      if (b.capsuleTimestamp === null) return -1;
      return a.capsuleTimestamp - b.capsuleTimestamp;
    });

    // Verify all 17 players are present
    expect(finalLb.length).toBe(17);

    // Verify ranks are assigned 1-17 with no duplicates
    const ranks = finalLb.map((p) => p.rank).sort((a, b) => a - b);
    expect(ranks).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17]);

    // Verify the order is correct — each player should have >= capsules than the one below
    for (let i = 0; i < sorted.length - 1; i++) {
      expect(sorted[i]!.capsules).toBeGreaterThanOrEqual(sorted[i + 1]!.capsules);
    }

    // Verify specific rankings
    // Eve (17 capsules) should be rank 1
    const eve = leaderboard.get(players[4]!.id)!;
    expect(eve.capsules).toBe(17);
    expect(eve.rank).toBe(1);
    expect(eve.completedAt).not.toBeNull();

    // Alice (15 capsules) should be rank 2
    const alice = leaderboard.get(players[0]!.id)!;
    expect(alice.capsules).toBe(15);
    expect(alice.rank).toBe(2);

    // Leo (14 capsules) should be rank 3
    const leo = leaderboard.get(players[11]!.id)!;
    expect(leo.capsules).toBe(14);
    expect(leo.rank).toBe(3);

    // Charlie and Karen both have 10 — Charlie opened first so should rank higher
    const charlie = leaderboard.get(players[2]!.id)!;
    const karen = leaderboard.get(players[10]!.id)!;
    expect(charlie.capsules).toBe(10);
    expect(karen.capsules).toBe(10);
    expect(charlie.rank).toBeLessThan(karen.rank);

    // Frank (0 capsules) should be rank 17 (last)
    const frank = leaderboard.get(players[5]!.id)!;
    expect(frank.capsules).toBe(0);
    expect(frank.rank).toBe(17);

    client.disconnect();
  });
});
