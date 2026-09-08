import { GameProfileId } from "@app/common";

export interface GameProfile<
  TeamColor extends string = string,
  PortColor extends string = string,
> {
  readonly id: GameProfileId;
  readonly name: string;

  readonly teamColors: TeamColor[];

  readonly portColors: PortColor[];

  readonly characters?: string[];

  readonly portNumbers: number[];

  readonly charactersRenderLocation?: string;

  // static means each port number is assigned a port color, dynamic means that each port number can be of any specified port color in the list
  readonly portColorType: "static" | "dynamic";

  // only needed for static
  portColorMap?: Map<number, PortColor>;
}

export type GameProfileProviderState = GameProfile;
