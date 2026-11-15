const LOCAL_DEMO_DATABASE_HOSTS = new Set([
  "localhost",
  "127.0.0.1",
  "[::1]",
  "postgres",
]);

const POSTGRES_PROTOCOLS = new Set(["postgresql:", "postgres:"]);

export function isAllowedDemoSeedTarget(
  connectionString: string,
  nodeEnvironment: string | undefined,
  allowRemoteDemoSeed: string | undefined,
): boolean {
  let databaseUrl: URL;

  try {
    databaseUrl = new URL(connectionString);
  } catch {
    return false;
  }

  if (!POSTGRES_PROTOCOLS.has(databaseUrl.protocol)) return false;

  const isLocalDemoDatabase =
    nodeEnvironment !== "production" &&
    LOCAL_DEMO_DATABASE_HOSTS.has(databaseUrl.hostname);
  const isExplicitResetSeed =
    allowRemoteDemoSeed === "1" && databaseUrl.hostname === "postgres";

  return isLocalDemoDatabase || isExplicitResetSeed;
}
