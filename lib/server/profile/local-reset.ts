import { resolve } from "node:path";

const LOCAL_DATABASE_HOSTS = new Set([
  "localhost",
  "127.0.0.1",
  "::1",
  "[::1]",
  "postgres",
]);

export function assertLocalDatabaseUrl(
  connectionString: string,
  nodeEnvironment = process.env.NODE_ENV,
): URL {
  let url: URL;
  try {
    url = new URL(connectionString);
  } catch {
    throw new Error("DATABASE_URL must be a valid local PostgreSQL URL.");
  }

  const databaseName = decodeURIComponent(url.pathname.replace(/^\//, ""));
  if (
    nodeEnvironment === "production" ||
    !["postgresql:", "postgres:"].includes(url.protocol) ||
    !LOCAL_DATABASE_HOSTS.has(url.hostname) ||
    databaseName !== "peat_guard"
  ) {
    throw new Error(
      "db:migrate:fresh only accepts the local peat_guard development database.",
    );
  }
  return url;
}

export function resolveSafeUploadsDirectory(
  configuredDirectory: string | undefined,
  workingDirectory: string,
): string {
  const resolvedWorkdir = resolve(workingDirectory);
  const directory = resolve(
    resolvedWorkdir,
    configuredDirectory?.trim() || ".data/uploads",
  );
  if (directory !== resolve(resolvedWorkdir, ".data", "uploads")) {
    throw new Error("Refusing to clear an upload path outside .data/uploads.");
  }
  return directory;
}
