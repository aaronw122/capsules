export type PlayerState = {
  id: string;
  name: string;
  capsules: number;
  rank: number;
  capsuleTimestamp: number | null;
  completedAt: number | null;
};

export type PlayerLeaderBoard = {
  name: string;
  capsules: number;
  rank: number;
  capsuleTimestamp: number | null;
  completedAt: number | null;
};

export type GameState = 'lobby' | 'playing' | 'gameOver';

export type LeaderBoard = PlayerState[] | [];

export type GameContext = {
  playerState: PlayerState | null;
  setPlayerState: React.Dispatch<React.SetStateAction<null | PlayerState>>;
  newName: string;
  setNewName: React.Dispatch<React.SetStateAction<string>>;
  handleNameChange: (text: string) => void;
  createPlayer: () => Promise<PlayerState>;
  leaderBoard: LeaderBoard | [];
  setLeaderBoard: React.Dispatch<React.SetStateAction<[] | PlayerState[]>>;
  capsules: Capsule[] | null;
  setCapsules: React.Dispatch<React.SetStateAction<null | Capsule[]>>;
  selectedCapsule: Capsule | null;
  setSelectedCapsule: React.Dispatch<React.SetStateAction<null | Capsule>>;
  escapePhrase: (string | null)[];
  setEscapePhrase: React.Dispatch<React.SetStateAction<(string | null)[]>>;
  gameState: GameState | null;
  setGameState: React.Dispatch<React.SetStateAction<GameState | null>>;
  endTime: number;
  setEndTime: React.Dispatch<React.SetStateAction<number>>;
  openCapsule: (capsule: Capsule) => void;
};

export type RootStackParamList = {
  Onboarding: undefined;
  Call: undefined;
  Login: undefined;
  AR: undefined;
  LeaderBoard: undefined;
};

export type Capsule = {
  id: string;
  letter: string;
  number: number;
  isOpened: boolean;
  position: number[];
  content: {
    name: string;
    funFact: string;
  };
};
