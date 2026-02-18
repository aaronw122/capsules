import { describe, it, expect } from 'bun:test';
import request from 'supertest';
import { app } from './index';

describe('GET /capsules', () => {
  it('should return an empty array initially', async () => {
    const res = await request(app).get('/capsules');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});

describe('POST /add/player', () => {
  it('should add a player to the leaderboard', async () => {
    const player = {
      id: '1',
      name: 'TestPlayer',
      capsules: 0,
      completedAt: null,
    };

    const res = await request(app).post('/add/player').send({ player });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Player added to leaderboard');
  });

  it('should return 200 when adding multiple players', async () => {
    const player = {
      id: '2',
      name: 'AnotherPlayer',
      capsules: 3,
      completedAt: '2026-02-18',
    };

    const res = await request(app).post('/add/player').send({ player });

    expect(res.status).toBe(200);
  });
});
