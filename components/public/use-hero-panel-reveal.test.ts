import { afterEach, expect, mock, spyOn, test } from "bun:test";
import { motionValue, spring } from "motion";

import {
  HERO_PANEL_SPRING,
  revealHeroPanelForKeyboard,
} from "@/components/public/use-hero-panel-reveal";

afterEach(() => mock.restore());

for (const [from, to] of [
  [0, 1],
  [1, 0],
  [0.3, 0.7],
  [0.7, 0.3],
]) {
  test(`panel progress settles from ${from} to ${to} without bouncing`, () => {
    const animation = spring({
      ...HERO_PANEL_SPRING,
      keyframes: [from, to],
    });
    let previous = from;

    // Drive the actual Motion spring with deterministic frame timestamps.
    for (let frame = 0; frame <= 180; frame += 1) {
      const { value } = animation.next((frame * 1000) / 60);
      expect(value).toBeGreaterThanOrEqual(Math.min(from, to) - 1e-9);
      expect(value).toBeLessThanOrEqual(Math.max(from, to) + 1e-9);
      if (to > from) {
        expect(value).toBeGreaterThanOrEqual(previous - 1e-9);
      } else {
        expect(value).toBeLessThanOrEqual(previous + 1e-9);
      }
      previous = value;
    }

    expect(previous).toBe(to);
  });
}

test("pointer focus does not jump the scroll position or panel scale", () => {
  const marker = document.createElement("div");
  const target = document.createElement("a");
  const progress = motionValue(0.45);
  const scrollTo = spyOn(window, "scrollTo").mockImplementation(() => {});
  spyOn(target, "matches").mockReturnValue(false);

  revealHeroPanelForKeyboard(target, marker, progress);

  expect(scrollTo).not.toHaveBeenCalled();
  expect(progress.get()).toBe(0.45);
});

test("keyboard focus reveals the full panel using the unscaled marker", () => {
  const marker = document.createElement("div");
  const target = document.createElement("a");
  const progress = motionValue(0.45);
  const scrollTo = spyOn(window, "scrollTo").mockImplementation(() => {});
  spyOn(target, "matches").mockReturnValue(true);
  spyOn(marker, "getBoundingClientRect").mockReturnValue(
    new window.DOMRect(0, 120, 1280, 800),
  );

  revealHeroPanelForKeyboard(target, marker, progress);

  expect(scrollTo).toHaveBeenCalledWith({
    top: 920 + window.scrollY,
    behavior: "instant",
  });
  expect(progress.get()).toBe(1);
});

test("missing scroll markers and non-element focus targets leave the panel alone", () => {
  const progress = motionValue(0.45);
  const scrollTo = spyOn(window, "scrollTo").mockImplementation(() => {});

  revealHeroPanelForKeyboard(document.createElement("a"), null, progress);
  revealHeroPanelForKeyboard(document, document.createElement("div"), progress);

  expect(scrollTo).not.toHaveBeenCalled();
  expect(progress.get()).toBe(0.45);
});
