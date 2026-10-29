import { afterEach } from "bun:test";
import { Window } from "happy-dom";

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
