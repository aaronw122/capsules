import { useContext, createContext, useState, useEffect, useRef } from 'react';
import Config from 'react-native-config';

import {
  Capsule,
  GameContext,
  GameState,
  LeaderBoard,
  type PlayerState,
  ArContext,
} from '../types';
import ARWorldMapModule from '../native/ARWorldMapModule';

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

const arContext = createContext<ArContext | null>(null);

export const useAR = () => {
  return useContext(arContext);
};

export function ARProvider({ children }: { children: React.ReactNode }) {
  const [relocalized, setRelocalized] = useState(false);
  const [trackingStatus, setTrackingStatus] = useState('initializing');

  //websockets will receive updated leaderboard from server. add mock data for now.

  const localizeWorld = () => {
    // Call directly — the native module queues the command if the
    // view isn't ready yet and replays it once the view is linked.
    console.log('[arContext] Starting AR session from bundle');
    ARWorldMapModule.startSessionFromBundle('arworldmap.data');

    const relocalSub = ARWorldMapModule.onRelocalized(() => {
      console.log('[arContext] Relocalized');
      setRelocalized(true);
    });

    const trackingSub = ARWorldMapModule.onTrackingStateChanged(e => {
      setTrackingStatus(e.status);
    });

    return () => {
      relocalSub.remove();
      trackingSub.remove();
    };
  };

  return (
    <arContext.Provider
      value={{
        relocalized,
        setRelocalized,
        trackingStatus,
        localizeWorld,
      }}
    >
      {children}
    </arContext.Provider>
  );
}
