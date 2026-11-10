#!/bin/sh
set -e

WORKER_PID=""
SERVER_PID=""

# Start background worker loop
start_worker() {
  echo "[entrypoint] Starting background worker supervisor..."
  (
    while true; do
      echo "[worker] Launching PEATGUARD background worker..."
      bun run worker || true
      echo "[worker] Worker exited. Respawning in 60s..."
      sleep 60
    done
  ) &
  WORKER_PID=$!
}

# Trap signals for graceful shutdown
shutdown() {
  echo "[entrypoint] Received termination signal. Stopping services..."
  if [ -n "$SERVER_PID" ]; then
    kill -TERM "$SERVER_PID" 2>/dev/null || true
  fi
  if [ -n "$WORKER_PID" ]; then
    kill -TERM "$WORKER_PID" 2>/dev/null || true
  fi
  if [ -n "$SERVER_PID" ]; then
    wait "$SERVER_PID" 2>/dev/null || true
  fi
  if [ -n "$WORKER_PID" ]; then
    wait "$WORKER_PID" 2>/dev/null || true
  fi
  exit 0
}

trap shutdown TERM INT

start_worker

echo "[entrypoint] Starting Next.js server on port ${PORT:-3000}..."
node ./node_modules/next/dist/bin/next start --hostname 0.0.0.0 --port "${PORT:-3000}" &
SERVER_PID=$!

wait "$SERVER_PID"
EXIT_CODE=$?

if [ -n "$WORKER_PID" ]; then
  kill -TERM "$WORKER_PID" 2>/dev/null || true
  wait "$WORKER_PID" 2>/dev/null || true
fi

exit "$EXIT_CODE"
