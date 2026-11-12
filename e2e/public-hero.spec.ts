import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

import { APP_ROUTES } from "@/lib/routes";

async function openLanding(page: Page) {
  await page.goto(APP_ROUTES.home);
  await page.evaluate(() => document.fonts.ready);
}

async function revealIntroduction(page: Page) {
  const introduction = page.locator(".public-hero__panel");
  await page.locator(".public-hero__video-window").evaluate((element) => {
    window.scrollTo({
      top: element.getBoundingClientRect().bottom + window.scrollY,
      behavior: "instant",
    });
  });
  await expect
    .poll(async () => (await introduction.boundingBox())?.height)
    .toBe(page.viewportSize()!.height);
  await expect(introduction).toBeInViewport({ ratio: 1 });
  return introduction;
}

test.describe("Public landing introduction", () => {
  test("starts small before hydration instead of flashing at full size", async ({
    browser,
  }) => {
    const context = await browser.newContext({
      javaScriptEnabled: false,
      reducedMotion: "no-preference",
      viewport: { width: 1280, height: 800 },
    });

    try {
      const page = await context.newPage();
      await openLanding(page);
      const box = await page.locator(".public-hero__panel").boundingBox();
      expect(box?.width).toBeGreaterThan(0);
      expect(box?.width).toBeLessThan(1280 * 0.5);
    } finally {
      await context.close();
    }
  });

  for (const viewport of [
    { width: 1904, height: 900 },
    { width: 1366, height: 768 },
    { width: 800, height: 513 },
    { width: 390, height: 844 },
    { width: 390, height: 667 },
    { width: 320, height: 568 },
  ]) {
    test(`fits one viewport at ${viewport.width} × ${viewport.height}`, async ({
      page,
    }) => {
      await page.setViewportSize(viewport);
      await openLanding(page);

      const videoViewport = await page
        .locator(".public-hero__stage")
        .boundingBox();
      expect(videoViewport?.height).toBe(viewport.height);

      const introduction = await revealIntroduction(page);
      const box = await introduction.boundingBox();
      expect(box?.height).toBe(viewport.height);

      await expect(page.getByRole("heading", { level: 1 })).toBeInViewport({
        ratio: 1,
      });
      await expect(
        introduction.getByRole("link", { name: "Buka peta pantauan" }),
      ).toBeInViewport({ ratio: 1 });
      await expect(
        introduction.getByRole("link", { name: "Kenali cara kerjanya" }),
      ).toBeInViewport({ ratio: 1 });
      await expect(page.locator(".public-hero__art")).toHaveJSProperty(
        "complete",
        true,
      );

      const layout = await page.evaluate(() => {
        const header = document.querySelector("header");
        const copy = document.querySelector(".public-hero__copy");
        const footer = document.querySelector(".public-hero__intro-footer");
        return {
          headerBottom: header?.getBoundingClientRect().bottom ?? 0,
          copyTop: copy?.getBoundingClientRect().top ?? 0,
          copyBottom: copy?.getBoundingClientRect().bottom ?? 0,
          footerTop: footer?.getBoundingClientRect().top ?? 0,
          overflows: document.documentElement.scrollWidth > innerWidth,
        };
      });
      expect(layout.copyTop).toBeGreaterThan(layout.headerBottom);
      expect(layout.copyBottom).toBeLessThan(layout.footerTop);
      expect(layout.overflows).toBe(false);
    });
  }

  test("scrolls continuously from video through introduction into the story", async ({
    page,
  }) => {
    await openLanding(page);
    const height = page.viewportSize()!.height;
    let previousTop = Number.POSITIVE_INFINITY;
    let previousHeadingTop = Number.POSITIVE_INFINITY;

    for (const progress of [0.25, 0.5, 0.75, 1, 1.25]) {
      const position = await page.evaluate(async (targetY) => {
        window.scrollTo({ top: targetY, behavior: "instant" });
        await new Promise<void>((resolve) => {
          requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
        });
        const introduction = document.querySelector(".public-hero__panel");
        const heading = document.querySelector("h1");
        if (!introduction || !heading) throw new Error("Missing introduction");
        return {
          top: introduction.getBoundingClientRect().top,
          headingTop: heading.getBoundingClientRect().top,
          headingOpacity: getComputedStyle(heading).opacity,
        };
      }, height * progress);

      expect(position.top).toBeLessThanOrEqual(previousTop + 0.5);
      expect(position.headingTop).toBeLessThanOrEqual(previousHeadingTop + 0.5);
      expect(position.headingOpacity).toBe("1");
      previousTop = position.top;
      previousHeadingTop = position.headingTop;
    }

    await page.evaluate(() => {
      window.scrollTo({ top: innerHeight * 2, behavior: "instant" });
    });
    await expect(
      page.getByRole("heading", {
        name: "Kondisi air ikut menentukan risiko kebakaran gambut.",
      }),
    ).toBeInViewport({ ratio: 1 });
  });

  test("navigates to sections and back using accessible fragment links", async ({
    page,
  }) => {
    await openLanding(page);
    await revealIntroduction(page);
    const navigation = page.getByRole("navigation", { name: "Navigasi utama" });
    const storyLink = navigation.getByRole("link", { name: "Mengapa gambut" });

    await storyLink.click();
    await expect(page).toHaveURL(
      `${APP_ROUTES.home}${APP_ROUTES.homeSections.peatlandStory}`,
    );
    await expect(storyLink).toHaveAttribute("aria-current", "location");
    await expect
      .poll(async () => {
        const story = await page
          .locator(APP_ROUTES.homeSections.peatlandStory)
          .boundingBox();
        return Math.round(story?.y ?? 0);
      })
      .toBe(128);

    await navigation
      .getByRole("link", { name: "Beranda", exact: true })
      .click();
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
    await expect(
      navigation.getByRole("link", { name: "Beranda", exact: true }),
    ).toHaveAttribute("aria-current", "location");
  });

  test("moves and expands together without dropping back down after scrolling stops", async ({
    page,
  }) => {
    await page.clock.install();
    await openLanding(page);
    await page.evaluate(() => {
      window.scrollTo({ top: innerHeight / 3, behavior: "instant" });
      window.dispatchEvent(new Event("scroll"));
    });
    await page.clock.runFor(3000);

    const readPosition = (scrollProgress?: number) =>
      page.evaluate((targetProgress) => {
        // Capture the first position before an animation frame can settle it.
        if (targetProgress !== undefined) {
          window.scrollTo({
            top: innerHeight * targetProgress,
            behavior: "instant",
          });
          window.dispatchEvent(new Event("scroll"));
        }
        const panel = document.querySelector(".public-hero__panel");
        const heading = document.querySelector("#hero-title");
        if (!panel || !heading) throw new Error("Missing introduction");
        const box = panel.getBoundingClientRect();
        return {
          scrollY,
          center: box.top + box.height / 2,
          headingTop: heading.getBoundingClientRect().top,
          scale: box.width / innerWidth,
        };
      }, scrollProgress);

    const settled = await readPosition();
    const before = await readPosition(0.6);

    // Native scrolling must not move the panel before its animation advances.
    expect(before.scale).toBeCloseTo(settled.scale, 4);
    expect(before.headingTop).toBeCloseTo(settled.headingTop, 0);
    expect(before.center).toBeCloseTo(settled.center, 0);

    await page.clock.runFor(3000);
    const after = await readPosition();

    expect(after.scrollY).toBe(before.scrollY);
    expect(after.scale).toBeGreaterThan(before.scale);
    expect(after.headingTop).toBeLessThanOrEqual(before.headingTop + 0.5);
    expect(after.center).toBeLessThanOrEqual(before.center + 0.5);
  });

  test("does not reverse its expansion or shrinkage during continuous scrolling", async ({
    page,
  }) => {
    await page.clock.install();
    await openLanding(page);
    await page.evaluate(() => {
      window.scrollTo({ top: innerHeight, behavior: "instant" });
      window.dispatchEvent(new Event("scroll"));
    });
    await page.clock.runFor(3000);

    const sampling = page.evaluate(async () => {
      const panel = document.querySelector(".public-hero__panel");
      if (!(panel instanceof HTMLElement)) throw new Error("Missing panel");
      const height = innerHeight;
      const nextFrame = () =>
        new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      const heading = document.querySelector("#hero-title");
      if (!heading) throw new Error("Missing introduction heading");
      const readPosition = () => {
        const box = panel.getBoundingClientRect();
        return {
          scale: box.width / innerWidth,
          top: box.top,
          center: box.top + box.height / 2,
          headingTop: heading.getBoundingClientRect().top,
        };
      };

      async function move(from: number, to: number) {
        const positions = [readPosition()];
        for (let frame = 0; frame <= 90; frame += 1) {
          window.scrollTo({
            top: height * (from + ((to - from) * frame) / 90),
            behavior: "instant",
          });
          window.dispatchEvent(new Event("scroll"));
          await nextFrame();
          positions.push(readPosition());
        }
        for (let frame = 0; frame < 180; frame += 1) {
          await nextFrame();
          positions.push(readPosition());
        }
        return positions;
      }

      const shrinking = await move(1, 0);
      const expanding = await move(0, 1);
      return { shrinking, expanding };
    });
    await page.clock.runFor(9500);
    const phases = await sampling;

    for (let index = 1; index < phases.shrinking.length; index += 1) {
      const previous = phases.shrinking[index - 1];
      const current = phases.shrinking[index];
      expect(current.scale).toBeLessThanOrEqual(previous.scale + 0.001);
      expect(current.top).toBeGreaterThanOrEqual(previous.top - 0.5);
      expect(current.center).toBeGreaterThanOrEqual(previous.center - 0.5);
      expect(current.headingTop).toBeGreaterThanOrEqual(
        previous.headingTop - 0.5,
      );
    }
    for (let index = 1; index < phases.expanding.length; index += 1) {
      const previous = phases.expanding[index - 1];
      const current = phases.expanding[index];
      expect(current.scale).toBeGreaterThanOrEqual(previous.scale - 0.001);
      expect(current.top).toBeLessThanOrEqual(previous.top + 0.5);
      expect(current.center).toBeLessThanOrEqual(previous.center + 0.5);
      expect(current.headingTop).toBeLessThanOrEqual(previous.headingTop + 0.5);
    }
    expect(phases.shrinking.at(-1)?.scale).toBeCloseTo(0.38, 3);
    expect(phases.expanding.at(-1)?.scale).toBeCloseTo(1, 3);
  });

  test("keeps the introduction visible and usable with reduced motion", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await openLanding(page);

    await expect(page.locator(".public-hero__stage")).toBeHidden();
    await expect(page.locator(".public-hero__panel")).toBeInViewport({
      ratio: 1,
    });
    await expect(page.locator("video")).toHaveJSProperty("paused", true);
    const primaryAction = page
      .locator(".public-hero__panel")
      .getByRole("link", {
        name: "Buka peta pantauan",
      });
    await primaryAction.focus();
    await expect(primaryAction).toBeFocused();
    await expect(primaryAction).toHaveCSS("outline-style", "solid");

    const accessibility = await new AxeBuilder({ page })
      .include("header")
      .include(".public-hero__panel")
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(accessibility.violations).toEqual([]);
  });

  test("keeps mobile navigation and introduction contrast accessible", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await openLanding(page);

    const accessibility = await new AxeBuilder({ page })
      .include("header")
      .include(".public-hero__panel")
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(accessibility.violations).toEqual([]);
  });
});
