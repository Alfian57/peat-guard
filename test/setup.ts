import { afterEach, mock } from "bun:test";
import { Window } from "happy-dom";

mock.module("server-only", () => ({}));

// Keep map component tests independent from developer-local .env credentials.
process.env.NEXT_PUBLIC_MAPTILER_KEY = "";

const happyWindow = new Window({ url: "http://localhost/" });

Object.assign(globalThis, {
  window: happyWindow,
  document: happyWindow.document,
  navigator: happyWindow.navigator,
  HTMLElement: happyWindow.HTMLElement,
  HTMLInputElement: happyWindow.HTMLInputElement,
  MutationObserver: happyWindow.MutationObserver,
  Node: happyWindow.Node,
  Event: happyWindow.Event,
  MouseEvent: happyWindow.MouseEvent,
  getComputedStyle: happyWindow.getComputedStyle.bind(happyWindow),
});

const { cleanup } = await import("@testing-library/react");

afterEach(cleanup);
