export type PlayerState = {
  id: string;
  name: string;
  capsules: number;
  completedAt: string | null;
  rank: number;
};

export type PlayerLeaderBoard = {
  name: string;
  capsules: number;
  completedAt: string | null;
  rank: number;
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
  content: {
    name: string;
    funFact: string;
  };
};
