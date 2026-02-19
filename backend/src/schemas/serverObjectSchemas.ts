export interface Player {
  id: string; // player uuid
  name: string; // player username
  capsules: number; // number of capsules player opened
  rank: number; // player leaderboard rank
  capsuleTimestamp: number | null; // timestamp of most recent capsule opened
  completedAt: number | null; // number if they finished with a timestamp or null if they didn't finish
}

export interface Capsule {
  id: string; // id for connection with coordinate points from ARWorld
  letter: string; // letter in escape phrase associated with capsules index in capsules array
  number: number; // capsule's index in capsules array
  isOpened: true | false; // flag of if the capsule has been opened or not
  position: number[]; // array of coordinates of where the capsule is located in AR world map
  content: {
    // content for the panel that will be shown to player when they open a capsule
    name: string;
    funFact: string;
  };
}
