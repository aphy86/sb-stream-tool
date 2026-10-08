import { describe, expect, it } from "vitest";
import {
  CLIENTS,
  defaultPlatform,
  getClient,
  getPlatformByEventUrl,
  platformById,
  resolveEventUrl,
} from "./registry";

/**
 * Users paste an event URL; the app has to figure out which platform it belongs to
 * and which event to fetch. These are table-driven so new URL shapes are one line each.
 */

describe("start.gg event URLs", () => {
  it.each([
    ["https://start.gg/tournament/domo-cup-12/event/melee-singles", "tournament/domo-cup-12/event/melee-singles"],
    ["https://www.start.gg/tournament/domo-cup-12/event/melee-singles", "tournament/domo-cup-12/event/melee-singles"],
    ["https://start.gg/tournament/domo-cup-12/event/melee-singles/brackets/123/456", "tournament/domo-cup-12/event/melee-singles"],
    ["https://start.gg/tournament/domo-cup-12/event/melee-singles?tab=sets", "tournament/domo-cup-12/event/melee-singles"],
    ["https://start.gg/tournament/domo-cup-12/event/melee-singles#top", "tournament/domo-cup-12/event/melee-singles"],
  ])("%s", (url, id) => {
    expect(resolveEventUrl(url)).toEqual({ platform: "startgg", url, id });
  });
});

describe("parry.gg event URLs", () => {
  it.each([
    ["https://parry.gg/domo-cup-12/melee-singles", "domo-cup-12/melee-singles"],
    ["https://www.parry.gg/domo-cup-12/melee-singles", "domo-cup-12/melee-singles"],
    ["https://parry.gg/domo-cup-12/_manage/melee-singles", "domo-cup-12/melee-singles"], // admin URL
    ["https://parry.gg/domo-cup-12/melee-singles?view=bracket", "domo-cup-12/melee-singles"],
  ])("%s", (url, id) => {
    expect(resolveEventUrl(url)).toEqual({ platform: "parrygg", url, id });
  });
});

describe("URLs that are not events", () => {
  it.each([
    "",
    "not a url",
    "http://start.gg/tournament/domo-cup-12/event/melee-singles", // http, not https
    "https://start.gg/tournament/domo-cup-12", // tournament page, no event
    "https://start.gg/tournament//event/melee-singles", // empty slug
    "https://evil-start.gg/tournament/a/event/b", // look-alike domain
    "https://start.gg.evil.com/tournament/a/event/b",
    "https://evil.com/?next=https://start.gg/tournament/a/event/b", // event URL buried in another URL
    "https://evil.com/?next=https://parry.gg/a/b",
    "https://parry.gg/domo-cup-12", // tournament only
    "https://challonge.com/domo12",
  ])("%j is rejected", (url) => {
    expect(resolveEventUrl(url)).toBeNull();
  });

  it("falls back to the default platform for unrecognized URLs", () => {
    expect(getPlatformByEventUrl("https://challonge.com/domo12")).toBe(defaultPlatform());
  });
});

describe("platform lookup", () => {
  it("finds platforms by id", () => {
    expect(platformById("startgg").displayName).toBe("start.gg");
    expect(platformById("parrygg").displayName).toBe("parry.gg");
  });

  it("throws a clear error for an unknown id", () => {
    expect(() => platformById("challonge" as never)).toThrow(/No tournament platform registered/);
  });

  it("routes a URL to its platform", () => {
    expect(getPlatformByEventUrl("https://parry.gg/a/b").id).toBe("parrygg");
    expect(getPlatformByEventUrl("https://start.gg/tournament/a/event/b").id).toBe("startgg");
  });
});

/**
 * Clients own an AbortController set and use the shared rate limiter, so creating a new
 * client per call would lose the ability to cancel in-flight requests. One client per
 * (apiKey, platform) pair.
 */
describe("getClient caching", () => {
  it("reuses the same client for the same key and platform", () => {
    CLIENTS.clear();
    expect(getClient("key-a", "startgg")).toBe(getClient("key-a", "startgg"));
  });

  it("keeps separate clients per platform and per API key", () => {
    CLIENTS.clear();
    const a = getClient("key-a", "startgg");
    expect(getClient("key-a", "parrygg")).not.toBe(a);
    expect(getClient("key-b", "startgg")).not.toBe(a);
    expect(CLIENTS.get("key-a")?.size).toBe(2);
  });
});
