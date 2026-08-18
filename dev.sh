#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
PB_URL="http://127.0.0.1:8090"
WEB_URL="http://127.0.0.1:5173"
PB_PID=""
WEB_PID=""
STARTED_PB=0
STARTED_WEB=0

cleanup() {
  status=$?
  trap - INT TERM EXIT

  if [ "$STARTED_WEB" -eq 1 ] && [ -n "$WEB_PID" ] && kill -0 "$WEB_PID" 2>/dev/null; then
    echo "Stopping web server..."
    kill -TERM "$WEB_PID" 2>/dev/null || true
  fi
  if [ "$STARTED_PB" -eq 1 ] && [ -n "$PB_PID" ] && kill -0 "$PB_PID" 2>/dev/null; then
    echo "Stopping PocketBase..."
    kill -TERM "$PB_PID" 2>/dev/null || true
  fi

  [ -z "$WEB_PID" ] || wait "$WEB_PID" 2>/dev/null || true
  [ -z "$PB_PID" ] || wait "$PB_PID" 2>/dev/null || true
  exit "$status"
}
trap cleanup INT TERM EXIT

url_is_up() {
  curl --silent --show-error --fail --max-time 1 -o /dev/null "$1"
}

wait_for_url() {
  url="$1"
  i=0
  while [ "$i" -lt 50 ]; do
    if url_is_up "$url" 2>/dev/null; then
      return 0
    fi
    i=$((i + 1))
    sleep 0.2
  done
  return 1
}

if url_is_up "$PB_URL/api/health" 2>/dev/null; then
  echo "PocketBase is already running at $PB_URL"
else
  echo "Starting PocketBase..."
  (
    cd "$ROOT_DIR"
    exec ./pocketbase/pocketbase serve \
      --dir=./pocketbase/pb_data \
      --migrationsDir=./pocketbase/pb_migrations \
      --http=127.0.0.1:8090
  ) &
  PB_PID=$!
  STARTED_PB=1
  if ! wait_for_url "$PB_URL/api/health"; then
    echo "PocketBase did not become ready at $PB_URL" >&2
    exit 1
  fi
fi

if url_is_up "$WEB_URL" 2>/dev/null; then
  echo "Web server is already running at $WEB_URL"
else
  echo "Starting web server..."
  (
    cd "$ROOT_DIR/web"
    exec ./node_modules/.bin/vite dev --host 127.0.0.1 --port 5173
  ) &
  WEB_PID=$!
  STARTED_WEB=1
  if ! wait_for_url "$WEB_URL"; then
    echo "Web server did not become ready at $WEB_URL" >&2
    exit 1
  fi
fi

echo "Development services are running. Press Ctrl+C to stop services started by this script."
wait
