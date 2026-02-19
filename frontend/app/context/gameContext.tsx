import { useContext, createContext, useState } from 'react';
import Config from 'react-native-config';

import { GameContext, type PlayerState } from '../types';

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

const gameContext = createContext<GameContext | null>(null);

export const useGame = () => {
  return useContext(gameContext);
};

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [playerState, setPlayerState] = useState<null | PlayerState>(null);
  const [newName, setNewName] = useState<string>('');

  const handleNameChange = (text: string) => {
    setNewName(text);
  };

  /*
    const newPlayer = {
      id: data.id,
      name: data.name,
      capsules: data.capsules,
      completedAt: null
    }
  */

  const createPlayer = async (): Promise<PlayerState> => {
    const playerObj = {
      name: newName,
    };

    console.log('baseUrl', baseURL);

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
      }}
    >
      {children}
    </gameContext.Provider>
  );
}
