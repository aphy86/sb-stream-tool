import { expect, player, scoreControls, test } from "./fixtures";

/**
 * The core flow of the app: an operator fills in the match and clicks UPDATE OVERLAY,
 * the app sends it over socket.io, and the stream overlay (what viewers see) updates.
 */
test.describe("Updating the stream overlay", () => {
  test("shows player tags, pronouns, and scores on the overlay", async ({ page, overlay }) => {
    await player(page, 0).tag.fill("Mang0");
    await player(page, 0).pronouns.fill("he/him");
    await player(page, 1).tag.fill("Zain");
    await scoreControls(page, 0).plus.click();
    await scoreControls(page, 1).plus.click();
    await scoreControls(page, 1).plus.click();

    await page.getByRole("button", { name: "UPDATE OVERLAY" }).click();

    await expect(overlay.locator("#left-playername")).toHaveText("Mang0");
    await expect(overlay.locator("#right-playername")).toHaveText("Zain");
    await expect(overlay.locator("#left-pronouns")).toHaveText("he/him");
    await expect(overlay.locator("#right-pronouns")).toHaveText("");
    await expect(overlay.locator("#left-score")).toHaveText("1");
    await expect(overlay.locator("#right-score")).toHaveText("2");
  });

  test("the app confirms when the overlay received the update", async ({ page, overlay: _overlay }) => {
    await player(page, 0).tag.fill("Mang0");
    await page.getByRole("button", { name: "UPDATE OVERLAY" }).click();

    await expect(page.getByText(/updated set information successfully/i)).toBeVisible();
  });

  test("marks a player in losers with [L]", async ({ page, overlay }) => {
    await player(page, 0).tag.fill("Mang0");
    await player(page, 1).tag.fill("Zain");
    await page.locator('[id="teams[1].inLosers"]').click();

    await page.getByRole("button", { name: "UPDATE OVERLAY" }).click();

    await expect(overlay.locator("#left-playername")).toHaveText("Mang0");
    await expect(overlay.locator("#right-playername")).toHaveText("Zain [L]");
  });

  test("the overlay only changes when UPDATE OVERLAY is clicked", async ({ page, overlay }) => {
    await player(page, 0).tag.fill("Mang0");
    await page.getByRole("button", { name: "UPDATE OVERLAY" }).click();
    await expect(overlay.locator("#left-playername")).toHaveText("Mang0");

    // Editing the form must not leak to the live stream until the operator submits.
    await player(page, 0).tag.fill("Hbox");
    await scoreControls(page, 0).plus.click();
    await page.waitForTimeout(500);
    await expect(overlay.locator("#left-playername")).toHaveText("Mang0");
    await expect(overlay.locator("#left-score")).toHaveText("0");

    await page.getByRole("button", { name: "UPDATE OVERLAY" }).click();
    await expect(overlay.locator("#left-playername")).toHaveText("Hbox");
    await expect(overlay.locator("#left-score")).toHaveText("1");
  });

  test("swapping teams and resubmitting swaps the overlay sides", async ({ page, overlay }) => {
    await player(page, 0).tag.fill("Mang0");
    await player(page, 1).tag.fill("Zain");
    await page.getByRole("button", { name: "UPDATE OVERLAY" }).click();
    await expect(overlay.locator("#left-playername")).toHaveText("Mang0");

    await page.getByRole("button", { name: "Swap Teams" }).click();
    await page.getByRole("button", { name: "UPDATE OVERLAY" }).click();

    await expect(overlay.locator("#left-playername")).toHaveText("Zain");
    await expect(overlay.locator("#right-playername")).toHaveText("Mang0");
  });
});
