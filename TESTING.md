# Testing

## Running tests

```bash
npm run test:unit       # run all unit tests once
npm run test:watch      # re-run on save while developing
npm run test:coverage   # run with coverage (fails if coverage drops below the thresholds)
npm run test:e2e        # build the app, then run the end-to-end tests
npm test                # end-to-end tests against the existing build (skips the build step)
```

Unit tests use [Vitest](https://vitest.dev). The root `vitest.config.ts` runs three projects:
`packages/renderer`, `packages/main`, and `packages/common`, each with its own config next to its code.
Test files sit next to the code they test as `*.test.ts`.

## What's covered

| Area | Test file | What it protects |
| --- | --- | --- |
| Rate limiter | `renderer/src/rate-limit/RequestScheduler.test.ts` | Never exceeding start.gg/parry.gg API limits, 429 backoff, cancellation, one shared limiter per platform |
| Event URLs | `renderer/src/platform/registry.test.ts` | Recognizing start.gg and parry.gg event links, rejecting look-alikes, one cached client per API key |
| Global hotkeys | `common/src/types/settings/shortcut.test.ts` | Global hotkeys must use a modifier or F-key so they don't steal other apps' shortcuts; default bindings are complete, unique, and safe |
| Match form | `renderer/src/match/helpers.test.ts` | Round-name parsing, singles vs. doubles detection, the character swap button |
| Slippi → team | `renderer/src/hooks/helpers.test.ts` | Mapping a Slippi winner (0-based player index) to the overlay team (1-based port) |
| General helpers | `renderer/src/utils/helpers.test.ts` | Score clamping, abort detection, shortcut labels |
| Slippi results | `main/src/components/slippi/helpers.test.ts` | Who won a game (stocks, timeouts, teams, Ice Climbers), filtering out handwarmers, detecting rematches |

Time-based code (the rate limiter) uses Vitest fake timers, so tests run in milliseconds and never flake.
`@app/preload` (the Electron bridge) is replaced in tests by `renderer/src/test/preload-stub.ts`.

## End-to-end tests

Playwright launches the real Electron app from the build output and drives it like an operator would.
They live in `tests/`:

| Test file | What it covers |
| --- | --- |
| `tests/app.spec.ts` | App starts cleanly with an empty match; score +/−, reset, never below 0; Swap Teams; Clear Info; global score hotkeys (via the same IPC message the OS hotkey sends); preload exposes the app bridge but not Node.js |
| `tests/overlay.spec.ts` | The core flow: fill in the match, click **UPDATE OVERLAY**, and check the stream overlay shows the right tags, pronouns, scores, and [L]; the app confirms delivery; the overlay doesn't change until you submit; swapping sides |

How it works (`tests/fixtures.ts`):
- Each test launches a fresh app with an **empty temporary settings folder**, so tests never touch your real API keys
  or shortcuts and can't affect each other. The app runs in development mode so it reads overlay files from `assets/`.
- The overlay opens in a **separate Chromium browser**, the same way OBS loads it, and connects to the app on port 20242.
  The overlay is served locally with socket.io from `node_modules` instead of the CDN, so tests don't depend on the network.
- Tests run one at a time, because the app allows a single instance and uses a fixed port.

Running locally: the first time, run `npx playwright install chromium`. On Linux without a display, use
`xvfb-run npm run test:e2e`.

## Known bugs

These are written as `it.fails(...)` tests: they **pass while the bug exists** and turn red once it's fixed.
When one goes red, change it to a normal `it(...)` so it guards against the bug coming back.

| Bug | Impact | Where |
| --- | --- | --- |
| Timeout won by the player in port 1 reports no winner | Score doesn't auto-update on stream | `getFfaWinnersFallback` / `getTeamsWinnersFallback` in `main/src/components/slippi/helpers.ts`: `playerIndex ? ... : []` treats index `0` as missing |
| Red team (team id `0`) win returns only one player | Inconsistent result vs. blue/green teams | `getWinner`: `if (winnerTeamId)` treats team id `0` as missing |
| "team-right-score-down" is labeled "Decrease **left** team's score by 1" | Two identical "left" entries in Settings | `ActionToName` in `renderer/src/utils/helpers.ts` |

Fix for the first two: compare against `undefined` instead of relying on truthiness (`playerIndex !== undefined`).

## CI/CD

- **`.github/workflows/quality.yml`** runs on every push to `main` and every pull request: lint, typecheck,
  unit tests on Ubuntu and Windows, and the end-to-end tests. Coverage is posted to the run's summary page, and the reports are
  uploaded as artifacts. The final **Quality gate** job is the one check to require in branch protection.
- **`.github/workflows/release.yml`** runs when a version tag is pushed (`git tag v0.0.5 && git push --tags`):
  it runs the quality gate, builds the app on Windows, macOS, and Linux, and creates a **draft** GitHub release
  with the installers for a person to review and publish.

The full workspace typecheck is currently non-blocking because of one pre-existing type error in
`preload/src/nodeCrypto.ts`. Once it's fixed, remove `continue-on-error` from that step.

Coverage thresholds in `vitest.config.ts` are set just under the current baseline (87% statements).
Raise them as tests are added; don't lower them to get a build to pass.
