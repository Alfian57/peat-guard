import { describe, expect, it } from "bun:test";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/lib/generated/prisma/client";

describe("Database Advisory Concurrency Locks", () => {
  it("acquires advisory transaction lock with executeRaw without void deserialization error", async () => {
    const result = await prisma.$transaction(async (tx) => {
      const lockResult = await tx.$executeRaw(
        Prisma.sql`SELECT pg_advisory_xact_lock(186202611, 1)`,
      );
      expect(typeof lockResult).toBe("number");
      return "lock_acquired";
    });

    expect(result).toBe("lock_acquired");
  });

  it("coordinates serial execution across concurrent lock requesters", async () => {
    const lockKey1 = 186202611;
    const lockKey2 = 2;
    const executionOrder: string[] = [];

    let releaseFirstTx: () => void = () => {};
    const firstTxWait = new Promise<void>((resolve) => {
      releaseFirstTx = resolve;
    });

    const firstAcquired = Promise.withResolvers<void>();
    const secondRequested = Promise.withResolvers<void>();
    // Worker 1 acquires lock and holds it until released
    const worker1 = prisma.$transaction(async (tx) => {
      await tx.$executeRaw(
        Prisma.sql`SELECT pg_advisory_xact_lock(${lockKey1}, ${lockKey2})`,
      );
      executionOrder.push("worker1_acquired");
      firstAcquired.resolve();
      await firstTxWait;
      executionOrder.push("worker1_released");
    });

    await firstAcquired.promise;

    // Worker 2 attempts to acquire same lock
    const worker2 = prisma.$transaction(async (tx) => {
      executionOrder.push("worker2_waiting");
      secondRequested.resolve();
      await tx.$executeRaw(
        Prisma.sql`SELECT pg_advisory_xact_lock(${lockKey1}, ${lockKey2})`,
      );
      executionOrder.push("worker2_acquired");
    });

    await secondRequested.promise;

    // Release worker 1
    releaseFirstTx();

    await Promise.all([worker1, worker2]);

    expect(executionOrder).toEqual([
      "worker1_acquired",
      "worker2_waiting",
      "worker1_released",
      "worker2_acquired",
    ]);
  });
});
