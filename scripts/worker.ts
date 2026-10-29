const shutdownSignals = ["SIGINT", "SIGTERM"] as const;

console.info(
  "PEATGUARD background worker is ready; no jobs are registered yet.",
);

await new Promise<void>((resolve) => {
  for (const signal of shutdownSignals) {
    process.once(signal, resolve);
  }
});

console.info("PEATGUARD background worker stopped.");
