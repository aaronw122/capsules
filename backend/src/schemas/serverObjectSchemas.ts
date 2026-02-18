export interface Player {
  id: string;
  name: string;
  capsules: number;
  completedAt: string | null;
}

export interface Capsule {
  id: string;
  letter: string;
  number: number;
  isOpened: true | false;
  content: {
    name: string;
    funFact: string;
  };
}
