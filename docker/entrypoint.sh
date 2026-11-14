#!/bin/sh
set -e

WORKER_PID=""
SERVER_PID=""

start_worker() {
  (
    child_pid=""
    stop_child() {
      if [ -n "$child_pid" ]; then
        kill -TERM "$child_pid" 2>/dev/null || true
        wait "$child_pid" 2>/dev/null || true
      fi
      exit 0
    }
    trap stop_child TERM INT

    while true; do
      echo "[worker] Launching PEATGUARD background worker..."
      bun --conditions=react-server scripts/worker.ts &
      child_pid=$!
      wait "$child_pid" || true

      echo "[worker] Worker exited. Respawning in 60s..."
      sleep 60 &
      child_pid=$!
      wait "$child_pid" || true
    done
  ) &
  WORKER_PID=$!
}

shutdown() {
  trap '' TERM INT
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
}

trap 'shutdown; exit 0' TERM INT
start_worker

echo "[entrypoint] Starting Next.js server on port ${PORT:-3000}..."
node ./node_modules/next/dist/bin/next start --hostname 0.0.0.0 --port "${PORT:-3000}" &
SERVER_PID=$!

EXIT_CODE=0
wait "$SERVER_PID" || EXIT_CODE=$?
SERVER_PID=""
shutdown
exit "$EXIT_CODE"
