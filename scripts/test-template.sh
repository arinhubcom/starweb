#!/usr/bin/env bash
# Test the Starweb template end to end: create the pinned starter, run
# setup.mjs, check that update.mjs has nothing to change, run the checks and
# the build, then test the built Worker.
# Usage: bash scripts/test-template.sh <workdir>
set -euo pipefail

if [ "$#" -ne 1 ]; then
  echo "Usage: bash scripts/test-template.sh <workdir>" >&2
  exit 2
fi

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WORKDIR="$(mkdir -p "$1" && cd "$1" && pwd)"
APP_DIR="$WORKDIR/app"
PREVIEW_LOG="$APP_DIR/.astro/preview.log"
PREVIEW_PID=""
STEP=0

step() {
  STEP=$((STEP + 1))
  echo
  echo "=== Step $STEP: $*"
}

fail() {
  echo "FAIL: $*" >&2
  exit 1
}

cleanup() {
  if [ -n "$PREVIEW_PID" ]; then
    # The background server leads its own process group: stop the group.
    kill -- "-$PREVIEW_PID" 2>/dev/null || kill "$PREVIEW_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT

free_port() {
  node -e '
    const net = require("node:net");
    const tryPort = (port) => {
      if (port > 4599) { console.log(0); return; }
      const server = net.createServer();
      server.once("error", () => tryPort(port + 1));
      server.listen(port, "127.0.0.1", () => {
        server.close(() => console.log(port));
      });
    };
    tryPort(4501);
  '
}

start_preview() {
  local port="$1" output
  # --background runs the server in its own process group and returns, the
  # same way with and without an AI agent in the environment.
  output="$(cd "$APP_DIR" && npm run preview -- --port "$port" --background 2>&1)"
  printf '%s\n' "$output"
  PREVIEW_PID="$(printf '%s\n' "$output" | grep -oE 'pid [0-9]+' | head -n 1 | grep -oE '[0-9]+' || true)"
  [ -n "$PREVIEW_PID" ] || fail "no PID in the preview output"
}

wait_for_url() {
  local url="" tries=0
  while [ -z "$url" ] && [ "$tries" -lt 120 ]; do
    if ! kill -0 "$PREVIEW_PID" 2>/dev/null; then
      cat "$PREVIEW_LOG" >&2
      fail "the preview server stopped"
    fi
    url="$(sed 's/\x1b\[[0-9;]*m//g' "$PREVIEW_LOG" 2>/dev/null | grep -E 'Local' | grep -oE 'http://[^ \\]+' | head -n 1 || true)"
    tries=$((tries + 1))
    [ -n "$url" ] || sleep 1
  done
  [ -n "$url" ] || fail "no Local URL in the preview output"
  echo "${url%/}"
}

status_of() {
  curl -s -o /dev/null -w '%{http_code}' --max-time 30 "$@"
}

expect_status() {
  local expected="$1" label="$2"
  shift 2
  local actual
  actual="$(status_of "$@")"
  [ "$actual" = "$expected" ] || fail "$label: expected $expected, got $actual"
  echo "ok: $label ($actual)"
}

wait_for_ok() {
  local url="$1" tries=0
  until [ "$(status_of "$url/")" = "200" ]; do
    tries=$((tries + 1))
    [ "$tries" -lt 60 ] || fail "GET / did not return 200 in 60 seconds"
    sleep 1
  done
}

step "Read the pinned create-emdash version"
VERSION="$(node -p 'require(process.argv[1]).devDependencies["create-emdash"]' "$REPO_ROOT/template/package.json")"
[ -n "$VERSION" ] || fail "template/package.json has no create-emdash"
echo "create-emdash $VERSION, work directory $WORKDIR"

step "Create the starter project"
rm -rf "$APP_DIR"
(cd "$WORKDIR" && npm create "emdash@$VERSION" app -- --template cloudflare:starter --install --yes)

step "Run setup.mjs"
node "$REPO_ROOT/scripts/setup.mjs" "$APP_DIR" --name tpl-test --site https://example.com

step "Run update.mjs --dry-run: nothing to change"
UPDATE_OUTPUT="$(node "$REPO_ROOT/scripts/update.mjs" "$APP_DIR" --dry-run)"
printf '%s\n' "$UPDATE_OUTPUT"
if printf '%s\n' "$UPDATE_OUTPUT" | grep -E '^[A-Za-z].*: [1-9][0-9]*$'; then
  fail "update.mjs --dry-run reports changes right after setup"
fi
echo "ok: update.mjs reports nothing to change"

step "Run npm run check"
(cd "$APP_DIR" && npm run check)

step "Run npm run build"
(cd "$APP_DIR" && npm run build)

step "Start npm run preview"
PORT="$(free_port)"
[ "$PORT" != "0" ] || fail "no free port between 4501 and 4599"
start_preview "$PORT"
BASE_URL="$(wait_for_url)"
echo "preview at $BASE_URL"
wait_for_ok "$BASE_URL"

step "Check the responses"
expect_status 200 "GET /" "$BASE_URL/"
expect_status 302 "GET /_emdash/admin/ redirects" "$BASE_URL/_emdash/admin/"
HEADERS="$(curl -s -D - -o /dev/null --max-time 30 "$BASE_URL/")"
CSP="$(printf '%s\n' "$HEADERS" | grep -i '^content-security-policy:' || true)"
[ -n "$CSP" ] || fail "no content-security-policy header"
printf '%s\n' "$CSP" | grep -q "frame-ancestors 'none'" || fail "CSP has no frame-ancestors 'none'"
printf '%s\n' "$CSP" | grep -q 'script-src' || fail "CSP has no script-src"
echo "ok: CSP header has frame-ancestors and script-src"
expect_status 403 "cross-origin POST /" -X POST \
  -H 'Origin: https://evil.example' -H 'Content-Type: text/plain' \
  --data 'x' "$BASE_URL/"
expect_status 200 "same-origin GET /" -H "Origin: $BASE_URL" "$BASE_URL/"

echo
echo "PASS: the template works end to end ($STEP steps)"
