import * as z from "zod";

const SocialMediaAccountSchema = z.strictObject({
  platform: z.string(),
  username: z.string(),
});

const PlayerInfoSchema = z.strictObject({
  teamName: z.string(),
  playerTag: z.string(),
  pronouns: z.string(),
  socials: z.array(SocialMediaAccountSchema),
});

const GameInfoSchema = z.strictObject({
  character: z.string(),
  altCostume: z.string(),
  port: z.number(),
});

const CommentatorSchema = z.strictObject({
  name: z.string(),
  socials: z.array(SocialMediaAccountSchema),
  pronouns: z.string(),
});

const PlayerSchema = z.strictObject({
  playerInfo: PlayerInfoSchema,
  gameInfo: GameInfoSchema,
});

const TeamSchema = z.strictObject({
  name: z.string(),
  score: z.number(),
  inLosers: z.boolean(),
  players: z.array(PlayerSchema),
  color: z.string().optional(),
});

const MatchSchema = z.strictObject({
  tournamentName: z.string(),
  bestOf: z.number(),
  roundFormat: z.string(),
  customRoundFormat: z.string(),
  roundNumber: z.string().optional(),
  setFormat: z.string(),
  teams: z.array(TeamSchema),
  commentators: z.array(CommentatorSchema),
});

export { MatchSchema };
