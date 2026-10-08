import { test as base, expect, type Page } from "@playwright/test";
import { _electron as electron, chromium, type ElectronApplication } from "playwright";
import { createServer, type Server } from "node:http";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

/**
 * Shared setup for end-to-end tests.
 *
 * - `app`/`page`: launches the real Electron app from the build output (`npm run build`),
 *   in development mode so it reads overlay assets from `assets/`. Each test gets a fresh
 *   temporary settings folder, so tests never touch your real API keys or shortcuts and
 *   can't affect each other.
 * - `overlay`: opens the stream overlay in a separate Chromium browser, the way OBS loads it
 *   as a browser source. It connects to the app's socket.io server on port 20242.
 */

const ROOT = path.resolve(import.meta.dirname, "..");
const OVERLAY_DIR = path.join(ROOT, "assets", "overlay");
const SOCKET_IO_CLIENT = path.join(ROOT, "node_modules", "socket.io-client", "dist", "socket.io.min.js");

type Fixtures = {
  app: ElectronApplication;
  page: Page;
  overlay: Page;
};

export const test = base.extend<Fixtures>({
  app: async ({}, use) => {
    const home = await mkdtemp(path.join(tmpdir(), "sb-stream-tool-e2e-"));
    const app = await electron.launch({
      args: [...(process.platform === "linux" ? ["--no-sandbox"] : []), ROOT],
      cwd: ROOT,
      env: {
        ...process.env,
        PLAYWRIGHT_TEST: "true",
        NODE_ENV: "development",
        // Electron derives its settings folder from these, so each test gets an empty one.
        XDG_CONFIG_HOME: path.join(home, "config"), // Linux
        APPDATA: path.join(home, "appdata"), // Windows
        HOME: process.platform === "darwin" ? home : (process.env.HOME ?? home), // macOS
      },
    });

    app.process().stderr?.on("data", (d) => {
      const line = String(d);
      if (/error/i.test(line) && !/Sourcemap|dbus|gpu/i.test(line)) console.error(`[main] ${line.trim()}`);
    });

    await use(app);

    await app.close();
    await rm(home, { recursive: true, force: true });
  },

  page: async ({ app }, use) => {
    const page = await app.firstWindow();
    page.on("pageerror", (error) => console.error(`[renderer] ${error.message}`));
    await page.waitForLoadState("load");
    await expect(page.getByRole("button", { name: "UPDATE OVERLAY" })).toBeVisible();
    await use(page);
  },

  overlay: async ({ app: _app }, use) => {
    // Serve the overlay over HTTP, swapping the socket.io CDN script for the local copy
    // so the test doesn't depend on a third-party CDN being reachable.
    const server: Server = createServer(async (req, res) => {
      try {
        const url = new URL(req.url ?? "/", "http://localhost");
        if (url.pathname === "/socket.io.min.js") {
          res.setHeader("content-type", "text/javascript");
          return res.end(await readFile(SOCKET_IO_CLIENT));
        }
        const file = path.join(OVERLAY_DIR, path.normalize(url.pathname === "/" ? "/overlay.html" : url.pathname));
        if (!file.startsWith(OVERLAY_DIR)) throw new Error("outside overlay dir");
        let body: Buffer | string = await readFile(file);
        if (file.endsWith(".html")) {
          body = body
            .toString()
            .replace(/<script[^>]*src="https:\/\/cdn\.socket\.io[^"]*"[^>]*><\/script>/, '<script src="/socket.io.min.js"></script>');
          res.setHeader("content-type", "text/html");
        }
        res.end(body);
      } catch {
        res.statusCode = 404;
        res.end();
      }
    });
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    const { port } = server.address() as { port: number };

    const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM_PATH || undefined });
    const overlay = await browser.newPage();
    overlay.on("pageerror", (error) => console.error(`[overlay] ${error.message}`));
    await overlay.goto(`http://127.0.0.1:${port}/overlay.html`);
    // `socket` is the overlay's global socket.io client.
    await overlay.waitForFunction("typeof socket !== 'undefined' && socket.connected");

    await use(overlay);

    await browser.close();
    await new Promise((resolve) => server.close(resolve));
  },
});

export { expect };

/** The −/+ buttons around a score field (they have no accessible names, so locate by position). */
export function scoreControls(page: Page, team: 0 | 1) {
  const input = page.locator(`[id="teams[${team}].score"]`);
  const box = input.locator("xpath=..");
  return {
    input,
    minus: box.getByRole("button").first(),
    plus: box.getByRole("button").last(),
  };
}

/** Field locators for the first player on a team. */
export function player(page: Page, team: 0 | 1, index = 0) {
  const prefix = `teams[${team}].players[${index}]`;
  return {
    tag: page.locator(`[id="${prefix}.playerInfo.playerTag"]`),
    teamName: page.locator(`[id="${prefix}.playerInfo.teamName"]`),
    pronouns: page.locator(`[id="${prefix}.playerInfo.pronouns"]`),
  };
}
