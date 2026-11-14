import { describe, expect, test } from "bun:test";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runFirmsSyncJob } from "@/scripts/jobs/firms-sync";
import { getFirmsSyncIntervalMinutes } from "@/lib/server/firms/config";

describe("Background Worker Daemon Resiliency", () => {
  test("returns valid default sync interval in minutes", () => {
    const interval = getFirmsSyncIntervalMinutes();
    expect(interval).toBeGreaterThanOrEqual(10);
    expect(interval).toBeLessThanOrEqual(1440);
  });

  test("runs FIRMS sync job without throwing unhandled exceptions when unconfigured or rate limited", async () => {
    // Calling runFirmsSyncJob without NASA_FIRMS_MAP_KEY must catch cleanly and not throw
    const originalKey = process.env.NASA_FIRMS_MAP_KEY;
    try {
      delete process.env.NASA_FIRMS_MAP_KEY;
      await expect(runFirmsSyncJob()).resolves.toBeUndefined();
    } finally {
      if (originalKey) {
        process.env.NASA_FIRMS_MAP_KEY = originalKey;
      }
    }
  });

  test("entrypoint forwards shutdown to the real worker child", async () => {
    const directory = await mkdtemp(join(tmpdir(), "peatguard-worker-test-"));
    const script = [
      "#!/bin/sh",
      `name="$(basename "$0")"`,
      `printf '%s' "$$" > "$PEATGUARD_WORKER_TEST/$name.pid"`,
      `trap 'touch "$PEATGUARD_WORKER_TEST/$name.stopped"; exit 0' TERM`,
      `touch "$PEATGUARD_WORKER_TEST/$name.ready"`,
      "while true; do sleep 0.05; done",
    ].join("\n");
    const { PATH, ...environment } = process.env;
    await Promise.all(
      ["bun", "node"].map((name) =>
        writeFile(join(directory, name), script, { mode: 0o700 }),
      ),
    );
    const app = Bun.spawn(["sh", "docker/entrypoint.sh"], {
      env: {
        ...environment,
        PATH: directory + ":" + PATH,
        PEATGUARD_WORKER_TEST: directory,
      },
      stdout: "ignore",
      stderr: "ignore",
    });
    try {
      const ready = () =>
        Promise.all(
          ["bun", "node"].map((name) =>
            Bun.file(join(directory, name + ".ready")).exists(),
          ),
        );
      for (
        let remaining = 50;
        remaining > 0 && !(await ready()).every(Boolean);
        remaining -= 1
      ) {
        await Bun.sleep(20);
      }
      expect(await ready()).toEqual([true, true]);
      app.kill("SIGTERM");
      const exitCode = await Promise.race([
        app.exited,
        Bun.sleep(2_500).then(() => null),
      ]);
      expect(exitCode).toBe(0);
      expect(await Bun.file(join(directory, "bun.stopped")).exists()).toBe(
        true,
      );
      expect(await Bun.file(join(directory, "node.stopped")).exists()).toBe(
        true,
      );
    } finally {
      if (app.exitCode === null) app.kill("SIGKILL");
      for (const name of ["bun", "node"]) {
        const pidFile = Bun.file(join(directory, name + ".pid"));
        const terminated = await Bun.file(
          join(directory, name + ".stopped"),
        ).exists();
        if (!terminated && (await pidFile.exists())) {
          const pid = Number(await pidFile.text());
          try {
            if (Number.isSafeInteger(pid) && pid > 1)
              process.kill(pid, "SIGKILL");
          } catch {}
        }
      }
      await rm(directory, { recursive: true, force: true });
    }
  });
});
