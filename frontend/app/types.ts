export type PlayerState = {
  id: string;
  name: string;
  capsules: number;
  completedAt: string;
  place: number;
};

export type LeaderBoard = PlayerState[];

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
};
