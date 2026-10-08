import type { BrowserWindow } from "electron";
import { expect, player, scoreControls, test } from "./fixtures";

test.describe("App launch", () => {
  test("opens a visible main window without crashing or showing DevTools", async ({ app, page }) => {
    const window = await app.browserWindow(page);
    const state = await window.evaluate((win: BrowserWindow) => ({
      isVisible: win.isVisible(),
      isCrashed: win.webContents.isCrashed(),
      isDevToolsOpened: win.webContents.isDevToolsOpened(),
    }));

    expect(state.isCrashed, "the app crashed").toBe(false);
    expect(state.isVisible, "the main window is not visible").toBe(true);
    expect(state.isDevToolsOpened, "DevTools should be closed").toBe(false);
  });

  test("starts with an empty match", async ({ page }) => {
    await expect(page.locator("#tournamentName")).toHaveValue("");
    await expect(page.locator("#bestOf")).toHaveValue("1");
    await expect(page.locator('button[name="roundFormat"]')).toHaveText("Friendlies");
    await expect(page.locator('button[name="setFormat"]')).toHaveText("Singles");

    for (const team of [0, 1] as const) {
      await expect(scoreControls(page, team).input).toHaveValue("0");
      await expect(player(page, team).tag).toHaveValue("");
    }
    // Player 1 defaults to port 1, player 2 to port 2.
    await expect(page.locator('button[name="teams[0].players[0].gameInfo.port"]')).toHaveText("1");
    await expect(page.locator('button[name="teams[1].players[0].gameInfo.port"]')).toHaveText("2");
  });
});

test.describe("Score controls", () => {
  test("+ and − change the score", async ({ page }) => {
    const left = scoreControls(page, 0);
    await left.plus.click();
    await left.plus.click();
    await expect(left.input).toHaveValue("2");
    await left.minus.click();
    await expect(left.input).toHaveValue("1");
  });

  test("score never goes below 0", async ({ page }) => {
    const left = scoreControls(page, 0);
    await left.minus.click();
    await left.minus.click();
    await expect(left.input).toHaveValue("0");
  });

  test("Reset Score clears one team; Reset all Scores clears both", async ({ page }) => {
    const left = scoreControls(page, 0);
    const right = scoreControls(page, 1);
    await left.plus.click();
    await right.plus.click();
    await right.plus.click();

    await page.getByRole("button", { name: "Reset Score" }).first().click();
    await expect(left.input).toHaveValue("0");
    await expect(right.input).toHaveValue("2");

    await left.plus.click();
    await page.getByRole("button", { name: "Reset all Scores" }).click();
    await expect(left.input).toHaveValue("0");
    await expect(right.input).toHaveValue("0");
  });
});

test.describe("Teams", () => {
  test("Swap Teams swaps players and scores between sides", async ({ page }) => {
    await player(page, 0).tag.fill("Mang0");
    await player(page, 1).tag.fill("Zain");
    await scoreControls(page, 0).plus.click();

    await page.getByRole("button", { name: "Swap Teams" }).click();

    await expect(player(page, 0).tag).toHaveValue("Zain");
    await expect(player(page, 1).tag).toHaveValue("Mang0");
    await expect(scoreControls(page, 0).input).toHaveValue("0");
    await expect(scoreControls(page, 1).input).toHaveValue("1");
  });

  test("Clear Info empties a player's fields", async ({ page }) => {
    const p = player(page, 0);
    await p.tag.fill("Mang0");
    await p.pronouns.fill("he/him");

    await page.getByRole("button", { name: "Clear Info" }).first().click();

    await expect(p.tag).toHaveValue("");
    await expect(p.pronouns).toHaveValue("");
  });
});

test.describe("Global hotkeys", () => {
  /**
   * Real global hotkeys come from the OS, which a test can't press reliably. This sends the same
   * IPC message the main process sends when one fires, covering everything after the keypress.
   */
  test("a global score hotkey updates the right team's score", async ({ app, page }) => {
    const fire = (action: string) =>
      app.evaluate(({ BrowserWindow }, a) => BrowserWindow.getAllWindows()[0].webContents.send("shortcut/global-event", a), action);

    await fire("team-right-score-up");
    await fire("team-right-score-up");
    await fire("team-left-score-up");
    await expect(scoreControls(page, 1).input).toHaveValue("2");
    await expect(scoreControls(page, 0).input).toHaveValue("1");

    await fire("team-right-score-down");
    await expect(scoreControls(page, 1).input).toHaveValue("1");
  });

  test("global score-down hotkey never takes a score below 0", async ({ app, page }) => {
    await app.evaluate(({ BrowserWindow }) =>
      BrowserWindow.getAllWindows()[0].webContents.send("shortcut/global-event", "team-left-score-down"),
    );
    await expect(scoreControls(page, 0).input).toHaveValue("0");
  });
});

test.describe("Preload security", () => {
  test("the renderer gets the app bridge but not Node.js", async ({ page }) => {
    const exposed = await page.evaluate(() => ({
      send: typeof (globalThis as Record<string, unknown>)[btoa("send")],
      updateOverlay: typeof (globalThis as Record<string, unknown>)[btoa("updateOverlay")],
      require: typeof (globalThis as Record<string, unknown>).require,
      process: typeof (globalThis as Record<string, unknown>).process,
    }));

    expect(exposed.send).toBe("function");
    expect(exposed.updateOverlay).toBe("function");
    // Context isolation: page scripts must not be able to reach Node APIs.
    expect(exposed.require).toBe("undefined");
    expect(exposed.process).toBe("undefined");
  });
});
