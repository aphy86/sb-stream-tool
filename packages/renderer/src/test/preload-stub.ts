/**
 * Test-only stand-in for @app/preload (the Electron bridge), which only exists inside
 * the running app. Functions are spies so tests can assert what would be sent.
 */
import { vi } from "vitest";

export const updateOverlay = vi.fn(() => Promise.resolve());
