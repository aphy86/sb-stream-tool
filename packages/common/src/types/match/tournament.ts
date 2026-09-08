export type SocialMediaAccount = {
  platform: string;
  username: string;
};

export type PlayerInfo = {
  teamName: string;
  playerTag: string;
  pronouns: string;
  socials: SocialMediaAccount[];
};

export type Player = {
  playerInfo: PlayerInfo;
  gameInfo: GameInfo;
};

export type Team = {
  name: string;
  score: number;
  inLosers: boolean;
  players: Player[];
  color?: string;
};

export type Commentator = {
  name: string;
  twitter: string;
  pronouns: string;
};

export type GameInfo = {
  character: string;
  altCostume: string;
  port: number;
};

export type Tournament = {
  name: string;
  bestOf: number;
  roundFormat: string;
  customRoundFormat: string;
  roundNumber?: number;
  setFormat: string;
  teams: Team[];
  commentators: Commentator[];
};

export type Placement =
  | "Friendlies"
  | "Exhibition Match"
  | "Money Match"
  | "Losers Round"
  | "Winners Round"
  | "Winners Quarter-Final"
  | "Winners Semi-Final"
  | "Winners Final"
  | "Losers Quarter-Final"
  | "Losers Semi-Final"
  | "Losers Final"
  | "Grand Final"
  | "Grand Finals Reset"
  | "Custom Match";
