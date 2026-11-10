import "dotenv/config";

import { spawn } from "node:child_process";
import { lstat, mkdir, readdir, rm } from "node:fs/promises";
import { join } from "node:path";

import {
  assertLocalDatabaseUrl,
  resolveSafeUploadsDirectory,
} from "../lib/server/profile/local-reset";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is required for the local fresh reset.");
}
assertLocalDatabaseUrl(connectionString);

const uploadDirectory = resolveSafeUploadsDirectory(
  process.env.UPLOADS_DIR,
  process.cwd(),
);
const uploadParent = join(process.cwd(), ".data");

async function validateUploadPath() {
  for (const path of [uploadParent, uploadDirectory]) {
    try {
      const stats = await lstat(path);
      if (!stats.isDirectory() || stats.isSymbolicLink()) {
        throw new Error(
          "Refusing to reset through a non-directory or symbolic upload path.",
        );
      }
    } catch (error) {
      if (!(
        error instanceof Error &&
        "code" in error &&
        error.code === "ENOENT"
      )) {
        throw error;
      }
    }
  }
}

await validateUploadPath();

async function runCommand(args: string[]): Promise<number> {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, args, {
      cwd: process.cwd(),
      env: { ...process.env, PEATGUARD_FRESH_RESET: "1" },
      stdio: "inherit",
    });
    child.once("error", reject);
    child.once("exit", (code) => resolve(code ?? 1));
  });
}

const migrateExitCode = await runCommand([
  "x",
  "prisma",
  "migrate",
  "reset",
  "--force",
]);
if (migrateExitCode !== 0) process.exit(migrateExitCode);

try {
  const stats = await lstat(uploadDirectory);
  if (!stats.isDirectory() || stats.isSymbolicLink()) {
    throw new Error(
      "Refusing to clear a non-directory or symbolic upload path.",
    );
  }
  const entries = await readdir(uploadDirectory);
  await Promise.all(
    entries.map((entry) =>
      rm(join(uploadDirectory, entry), { force: true, recursive: true }),
    ),
  );
} catch (error) {
  if (!(error instanceof Error && "code" in error && error.code === "ENOENT")) {
    throw error;
  }
}
await mkdir(uploadDirectory, { recursive: true, mode: 0o700 });

const seedExitCode = await runCommand(["run", "db:seed"]);
if (seedExitCode !== 0) process.exit(seedExitCode);
