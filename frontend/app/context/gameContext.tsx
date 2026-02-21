import { useContext, createContext, useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import Config from 'react-native-config';

import {
  Capsule,
  GameContext,
  GameState,
  LeaderBoard,
  type PlayerState,
} from '../types';

const baseURL = Config.BASE_URL;

/*
states to be added  here:
playerState
gameState
capsuleState
capsuleState
gameTimer?
escapePhrase
Name
leaderBoard
*/

/*
const mockLeaderBoard: LeaderBoard = [
  { id: 'a1b2c3', name: 'Alice', capsules: 5, completedAt: null, rank: 1 },
  { id: 'd4e5f6', name: 'Bob', capsules: 3, completedAt: null, rank: 2 },
  { id: 'g7h8i9', name: 'Charlie', capsules: 1, completedAt: null, rank: 3 },
];
*/

const gameContext = createContext<GameContext | null>(null);

export const useGame = () => {
  return useContext(gameContext);
};

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [playerState, setPlayerState] = useState<null | PlayerState>(null);
  const [newName, setNewName] = useState<string>('');
  const [leaderBoard, setLeaderBoard] = useState<[] | LeaderBoard>([]);
  const [gameState, setGameState] = useState<null | GameState>(null);
  const [capsules, setCapsules] = useState<Map<string, Capsule>>(new Map());
  const [selectedCapsule, setSelectedCapsule] = useState<Capsule | null>(null);
  const [endTime, setEndTime] = useState<number>(0);
  const [escapePhrase, setEscapePhrase] = useState<(string | null)[]>(
    new Array(17).fill(null),
  );
  const [endResult, setEndResult] = useState<'win' | 'lose' | null>(null);
  const [winCompletedAt, setWinCompletedAt] = useState<string | null>(null);
  const websocket = useRef<Socket | null>(null);
  const playerIdRef = useRef<string | null>(null);
  const endResultRef = useRef<'win' | 'lose' | null>(null);

  const handleNameChange = (text: string) => {
    setNewName(text);
  };

  //websockets will receive updated leaderboard from server. add mock data for now.

  const fetchCapsules = async () => {
    try {
      const response = await fetch(`${Config.BASE_URL}/capsules`);
      const data: Capsule[] = await response.json();
      const newCapsules = new Map();
      data.forEach(el => {
        newCapsules.set(el.id, el);
      });
      setCapsules(newCapsules);
    } catch (err) {
      console.error('[ar.tsx] Failed to fetch capsules:', err);
    }
  };

  const webSocketConnection = () => {
    // create websocket connection
    websocket.current = io(baseURL);

    websocket.current.on('connect', () => {
      console.log('[gameContext] Socket connected, id:', websocket.current?.id);
    });

    websocket.current.on('connect_error', err => {
      console.error('[gameContext] Socket connection error:', err.message);
    });

    // listens for server emit of game start after curl request
    websocket.current.on('gameStart', (data: number) => {
      console.log('gameStart received!');
      setGameState('playing');
      setEndTime(data); // data = endsAt value
      endResultRef.current = null;
      setEndResult(null);
      setWinCompletedAt(null);
      setCapsules(prev => {
        const next = new Map(prev);
        next.forEach((c, key) => next.set(key, { ...c, isOpened: false }));
        return next;
      });
      setEscapePhrase(new Array(17).fill(null));
      setSelectedCapsule(null);
    });

    // listens for server emit leaderboard update
    websocket.current.on('leaderboardUpdate', (data: PlayerState[]) => {
      setLeaderBoard(data);

      const player = data.find(p => p.id === playerIdRef.current);
      if (player && player.capsules === 17 && endResultRef.current === null) {
        endResultRef.current = 'win';
        setEndResult('win');
        setWinCompletedAt(player.completedAt);
        setSelectedCapsule(null);
      }
    });

    // listens for server emit game over state
    websocket.current.on('gameOver', () => {
      setGameState('gameOver');
      if (endResultRef.current === null) {
        endResultRef.current = 'lose';
        setEndResult('lose');
      }
    });
  };

  //openCapsule function
  const openCapsule = (capsule: Capsule) => {
    if (!capsule.isOpened) {
      const newCapsule = { ...capsule, isOpened: true };

      setCapsules(prev => {
        const next = new Map(prev);
        next.set(newCapsule.id, newCapsule);
        return next;
      });
      setSelectedCapsule(newCapsule);
      setEscapePhrase(prev => {
        const updated = [...prev];
        updated[capsule.number] = capsule.letter;
        return updated;
      });

      // emit event to update player state and leaderboard
      websocket.current?.emit('openCapsule', playerState?.id);
    } else {
      setSelectedCapsule(capsule);
    }
  };

  const triggerLocalGameOver = () => {
    if (endResultRef.current !== null) return;
    setGameState('gameOver');
    endResultRef.current = 'lose';
    setEndResult('lose');
  };

  useEffect(() => {
    fetchCapsules();
  }, []);

  useEffect(() => {
    playerIdRef.current = playerState?.id ?? null;
  }, [playerState]);

  //fire this once the user submit name
  const createPlayer = async (): Promise<PlayerState> => {
    const playerObj = {
      name: newName,
    };

    const response = await fetch(`${baseURL}/add/player`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(playerObj),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `HTTP error: ${response.status}`);
    }

    return data;
  };

  return (
    <gameContext.Provider
      value={{
        playerState,
        setPlayerState,
        createPlayer,
        newName,
        setNewName,
        handleNameChange,
        leaderBoard,
        setLeaderBoard,
        capsules,
        setCapsules,
        selectedCapsule,
        setSelectedCapsule,
        escapePhrase,
        setEscapePhrase,
        gameState,
        setGameState,
        endTime,
        setEndTime,
        endResult,
        winCompletedAt,
        triggerLocalGameOver,
        openCapsule,
        webSocketConnection,
      }}
    >
      {children}
    </gameContext.Provider>
  );
}
