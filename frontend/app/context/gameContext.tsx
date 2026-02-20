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
  const [capsules, setCapsules] = useState<null | Capsule[]>(null);
  const [selectedCapsule, setSelectedCapsule] = useState<Capsule | null>(null);
  const [endTime, setEndTime] = useState<number>(0);
  const [escapePhrase, setEscapePhrase] = useState<(string | null)[]>([
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
  ]);
  const websocket = useRef<Socket | null>(null);

  const handleNameChange = (text: string) => {
    setNewName(text);
  };

  //websockets will receive updated leaderboard from server. add mock data for now.

  const fetchCapsules = async () => {
    try {
      const response = await fetch(`${Config.BASE_URL}/capsules`);
      const data: Capsule[] = await response.json();
      setCapsules(data);
      console.log(`[ar.tsx] Fetched ${data.length} capsules from backend`);
    } catch (err) {
      console.error('[ar.tsx] Failed to fetch capsules:', err);
    }
  };

  //openCapsule function
  const openCapsule = (capsule: Capsule) => {
    capsule.isOpened = true;
    setSelectedCapsule(capsule);

    // updating player's progress on escape phrase
    const updatedEscapePhrase = [...escapePhrase]; // make copy of escape phrase array
    updatedEscapePhrase[capsule.number] = capsule.letter; // update letter they found in capsule
    setEscapePhrase(updatedEscapePhrase);

    // emit event to update player state and leaderboard
    websocket.current?.emit('openCapsule', playerState?.id);
  };

  useEffect(() => {
    fetchCapsules();
  }, []);

  //fire this once the user submit name
  const createPlayer = async (): Promise<PlayerState> => {
    const playerObj = {
      name: newName,
    };

    console.log('baseUrl', baseURL);

    // create websocket connection
    websocket.current = io(baseURL);

    // listens for server emit of game start after curl request
    websocket.current.on('gameStart', (data: number) => {
      console.log('Game Started');

      setGameState('playing');
      setEndTime(data); // data = endsAt value
    });

    // listens for server emit leaderboard update
    websocket.current.on('leaderboardUpdate', (data: PlayerState[]) => {
      setLeaderBoard(data);

      console.log('leaderboard updated');
    });

    // listens for server emit game over state
    websocket.current.on('gameOver', () => {
      console.log('Game OVer');
      setGameState('gameOver');
    });

    const response = await fetch(`${baseURL}/add/player`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(playerObj),
    });

    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }

    const data = await response.json();

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
        openCapsule,
      }}
    >
      {children}
    </gameContext.Provider>
  );
}
