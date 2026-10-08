import { describe, expect, it } from "vitest";
import type { PlatformSet } from "@renderer/types/platform";
import { getSetType, parseMatchName, swapCharacters } from "./helpers";

function makeSet(playersPerSide: [number, number]): PlatformSet {
  const side = (name: string, n: number) => ({
    name,
    players: Array.from({ length: n }, (_, i) => ({
      teamName: "",
      playerTag: `${name}-${i}`,
      pronouns: "",
      socials: [{ platform: "", username: "" }],
    })),
  });
  return {
    matchName: "Winners Round 1",
    state: "ready",
    stream: "Main Stream",
    tournamentName: "Domo Cup",
    entrants: [side("Left", playersPerSide[0]), side("Right", playersPerSide[1])],
  };
}

describe("parseMatchName (platform round text -> overlay fields)", () => {
  it.each([
    ["Winners Round 1", { matchFormat: "Winners Round", round: "1", customMatchName: null }],
    ["Losers Round 3", { matchFormat: "Losers Round", round: "3", customMatchName: null }],
    ["Grand Final", { matchFormat: "Grand Final", round: null, customMatchName: null }],
    ["Winners Semi-Final", { matchFormat: "Winners Semi-Final", round: null, customMatchName: null }],
    ["Top 8 Exhibition", { matchFormat: "Custom Match", round: null, customMatchName: "Top 8 Exhibition" }],
    ["", { matchFormat: "Custom Match", round: null, customMatchName: "" }],
  ])("%j", (input, expected) => {
    expect(parseMatchName(input)).toEqual(expected);
  });
});

describe("getSetType", () => {
  it("is Singles for 1v1", () => expect(getSetType(makeSet([1, 1]))).toBe("Singles"));
  it("is Doubles for 2v2", () => expect(getSetType(makeSet([2, 2]))).toBe("Doubles"));
  it("falls back to Singles for an uneven 2v1", () => expect(getSetType(makeSet([2, 1]))).toBe("Singles"));
});

describe("swapCharacters (the swap button between teams)", () => {
  /** Minimal stand-in for TanStack Form: reads/writes paths like teams[1].players[0].gameInfo */
  function fakeForm(state: { teams: { players: { gameInfo: string }[] }[] }) {
    const resolve = (path: string) => path.match(/[^.[\]]+/g)!.map((k) => (/^\d+$/.test(k) ? Number(k) : k));
    return {
      state,
      getFieldValue(path: string) {
        return resolve(path).reduce<any>((obj, key) => obj?.[key], state);
      },
      setFieldValue(path: string, value: unknown) {
        const keys = resolve(path);
        const parent = keys.slice(0, -1).reduce<any>((obj, key) => (obj[key] ??= {}), state);
        parent[keys.at(-1)!] = value;
      },
    };
  }

  it("swaps characters between two singles teams", () => {
    const form = fakeForm({ teams: [{ players: [{ gameInfo: "Fox" }] }, { players: [{ gameInfo: "Marth" }] }] });
    swapCharacters(form, 0, 1);
    expect(form.state.teams.map((t) => t.players[0].gameInfo)).toEqual(["Marth", "Fox"]);
  });

  it("swaps every player's character in doubles", () => {
    const form = fakeForm({
      teams: [
        { players: [{ gameInfo: "Fox" }, { gameInfo: "Falco" }] },
        { players: [{ gameInfo: "Sheik" }, { gameInfo: "Peach" }] },
      ],
    });
    swapCharacters(form, 0, 1);
    expect(form.state.teams.map((t) => t.players.map((p) => p.gameInfo))).toEqual([
      ["Sheik", "Peach"],
      ["Fox", "Falco"],
    ]);
  });

  it("does nothing for out-of-range team indexes", () => {
    const form = fakeForm({ teams: [{ players: [{ gameInfo: "Fox" }] }, { players: [{ gameInfo: "Marth" }] }] });
    swapCharacters(form, 0, 2);
    expect(form.state.teams.map((t) => t.players[0].gameInfo)).toEqual(["Fox", "Marth"]);
  });
});
