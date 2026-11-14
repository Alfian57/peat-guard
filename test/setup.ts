import { afterEach, mock } from "bun:test";
import { Window } from "happy-dom";

mock.module("server-only", () => ({}));

// Prevent unhandled error if bun test evaluates files that import @playwright/test
mock.module("@playwright/test", () => ({
  test: Object.assign(() => {}, {
    describe: () => {},
    beforeEach: () => {},
    afterEach: () => {},
    beforeAll: () => {},
    afterAll: () => {},
    skip: () => {},
    only: () => {},
  }),
  expect: () => ({ toPass: () => {}, toBe: () => {} }),
}));

// Keep map component tests independent from developer-local .env credentials.
process.env.NEXT_PUBLIC_MAPTILER_KEY = "";

const happyWindow = new Window({ url: "http://localhost/" });

Object.assign(globalThis, {
  window: happyWindow,
  document: happyWindow.document,
  navigator: happyWindow.navigator,
  Element: happyWindow.Element,
  HTMLElement: happyWindow.HTMLElement,
  HTMLInputElement: happyWindow.HTMLInputElement,
  MutationObserver: happyWindow.MutationObserver,
  Node: happyWindow.Node,
  Event: happyWindow.Event,
  MouseEvent: happyWindow.MouseEvent,
  requestAnimationFrame: happyWindow.requestAnimationFrame.bind(happyWindow),
  cancelAnimationFrame: happyWindow.cancelAnimationFrame.bind(happyWindow),
  getComputedStyle: happyWindow.getComputedStyle.bind(happyWindow),
});

const { cleanup } = await import("@testing-library/react");

afterEach(cleanup);
