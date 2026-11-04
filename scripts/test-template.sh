#!/usr/bin/env bash
# Test the Starweb template end to end: create a project from template/ with
# setup.mjs, check that update.mjs has nothing to change, run the checks and
# the build, then test the built Worker.
# Usage: bash scripts/test-template.sh <workdir> [--quick] [--fresh]
# --quick stops after the checks, to iterate. It does not replace the full run.
# --fresh skips the template lockfile and runs the npm run check script in order.
set -euo pipefail

USAGE="Usage: bash scripts/test-template.sh <workdir> [--quick] [--fresh]"
if [ "$#" -lt 1 ]; then
  echo "$USAGE" >&2
  exit 2
fi
WORKDIR_ARG="$1"
shift
QUICK=0
FRESH=0
for arg in "$@"; do
  case "$arg" in
    --quick) QUICK=1 ;;
    --fresh) FRESH=1 ;;
    *)
      echo "$USAGE" >&2
      exit 2
      ;;
  esac
done

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WORKDIR="$(mkdir -p "$WORKDIR_ARG" && cd "$WORKDIR_ARG" && pwd)"
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

# Run commands in the project at the same time. Print the output of each command
# that fails. The commands must not read what another one writes.
run_parallel() {
  local logs="$WORKDIR/logs" command log index failed=0
  local -a pids=() commands=()
  rm -rf "$logs"
  mkdir -p "$logs"
  for command in "$@"; do
    log="$logs/${command//[^a-z]/-}.log"
    # shellcheck disable=SC2086 # Each command is a plain list of words.
    (cd "$APP_DIR" && $command) >"$log" 2>&1 &
    pids+=("$!")
    commands+=("$command")
  done
  for index in "${!pids[@]}"; do
    command="${commands[$index]}"
    if wait "${pids[$index]}"; then
      echo "ok: $command"
    else
      failed=1
      echo "FAILED: $command" >&2
      cat "$logs/${command//[^a-z]/-}.log" >&2
    fi
  done
  [ "$failed" -eq 0 ] || fail "a command failed"
}

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

step "Run setup.mjs"
rm -rf "$APP_DIR"
SETUP_ARGS=(--name tpl-test --site https://example.com)
[ "$FRESH" -eq 0 ] || SETUP_ARGS+=(--fresh-lock)
node "$REPO_ROOT/scripts/setup.mjs" "$APP_DIR" "${SETUP_ARGS[@]}"

step "Check the starter files and the encryption key"
[ -f "$APP_DIR/EMDASH.md" ] || fail "the project has no EMDASH.md"
[ -f "$APP_DIR/seed/seed.json" ] || fail "the project has no seed file"
[ -L "$APP_DIR/.claude/skills" ] || fail ".claude/skills is not a symbolic link"
[ -f "$APP_DIR/.claude/skills/emdash-cli/SKILL.md" ] || fail ".claude/skills does not resolve"
[ -f "$APP_DIR/.claude/skills/starweb-update/SKILL.md" ] || fail "Claude Code cannot reach the starweb-update skill"
grep -q "^name: starweb-update$" "$APP_DIR/.claude/skills/starweb-update/SKILL.md" || fail "the skill has the wrong name"
grep -qF "rules/UPDATE.md" "$APP_DIR/.claude/skills/starweb-update/SKILL.md" || fail "the skill does not point to rules/UPDATE.md"
[ ! -e "$APP_DIR/template" ] || fail "the project has a template folder"
[ ! -e "$APP_DIR/files" ] || fail "the project has a files folder"
[ ! -e "$REPO_ROOT/template/.env" ] || fail "template/ has an .env file"
grep -qE '^EMDASH_ENCRYPTION_KEY=emdash_enc_v1_[A-Za-z0-9_-]{43}$' "$APP_DIR/.env" || fail ".env has no encryption key"
grep -q '"name": "tpl-test"' "$APP_DIR/package.json" || fail "package.json has the wrong name"
if grep -q '"create-emdash"' "$APP_DIR/package.json"; then
  fail "package.json has create-emdash, which only the Starweb repository uses"
fi
grep -q '"name": "tpl-test"' "$APP_DIR/package-lock.json" || fail "package-lock.json has the wrong name"
if node "$REPO_ROOT/scripts/setup.mjs" "$APP_DIR" --name tpl-test >/dev/null 2>&1; then
  fail "setup.mjs ran on a folder that is not empty"
fi
for package in emdash @emdash-cms/cloudflare; do
  grep -qF "dependency-name: \"$package\"" "$APP_DIR/.github/dependabot.yml" || fail "dependabot.yml does not ignore $package"
done
echo "ok: starter files, encryption key, Dependabot exception, and empty folder check"

step "Check Fulldev UI and the button"
[ -f "$APP_DIR/components.json" ] || fail "the project has no components.json"
for package in cn shadcn tailwind-variants tw-animate-css; do
  grep -q "\"$package\": \"[0-9]" "$APP_DIR/package.json" || fail "package.json has no exact pin of $package"
done
if grep -rq 'class-variance-authority' "$APP_DIR/src" "$APP_DIR/package.json"; then
  fail "the project uses class-variance-authority, not tailwind-variants"
fi
for color in '--background: oklch' '--primary: oklch'; do
  if grep -qF -- "$color" "$APP_DIR/src/styles/global.css"; then
    fail "global.css has a color variable that overrides theme.css: $color"
  fi
done
grep -q -- '--radius:' "$APP_DIR/src/styles/global.css" || fail "global.css has no radius"
grep -q -- '--on-error:' "$APP_DIR/src/styles/theme.css" || fail "theme.css has no on-error role"
echo "ok: Fulldev UI, exact pins, and theme colors"

step "Run update.mjs --dry-run: nothing to change"
UPDATE_OUTPUT="$(node "$REPO_ROOT/scripts/update.mjs" "$APP_DIR" --dry-run)"
printf '%s\n' "$UPDATE_OUTPUT"
if printf '%s\n' "$UPDATE_OUTPUT" | grep -E '^[A-Za-z].*: [1-9][0-9]*$'; then
  fail "update.mjs --dry-run reports changes right after setup"
fi
echo "ok: update.mjs reports nothing to change"

step "Check the theme and the session binding"
grep -q '^@import "./theme.css";' "$APP_DIR/src/styles/global.css" || fail "global.css does not import theme.css"
grep -q -- '--surface-container-high: #' "$APP_DIR/src/styles/theme.css" || fail "theme.css has no MD3 roles"
grep -q -- '--color-surface-container-high: var(--surface-container-high);' "$APP_DIR/src/styles/theme.css" || fail "theme.css does not expose the MD3 roles"
grep -q '^\.dark {' "$APP_DIR/src/styles/theme.css" || fail "theme.css has no dark scheme"
cp "$APP_DIR/src/styles/theme.css" "$WORKDIR/theme.before.css"
(cd "$APP_DIR" && npx tsx scripts/theme.ts)
cmp "$WORKDIR/theme.before.css" "$APP_DIR/src/styles/theme.css" || fail "scripts/theme.ts output differs from the formatted file"
grep -q '"binding": "SESSION"' "$APP_DIR/wrangler.jsonc" || fail "wrangler.jsonc has no SESSION binding"
echo "ok: theme and session binding"

step "Check that Oxlint runs each plugin"
PROBE="$APP_DIR/src/oxlint-probe.tsx"
cat > "$PROBE" <<'EOF'
import { useEffect, useState } from "react";
import { cva } from "class-variance-authority";

export function Probe({ items }: { items: string[] }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    window.addEventListener("resize", () => setCount(2));
    Promise.resolve(1);
  }, []);
  debugger;
  const last = items[items.length - 1];
  void cva;
  return (
    <div>
      {count}
      {last}
      <img src="/x.png" />
    </div>
  );
}
EOF
OXLINT_OUTPUT="$(cd "$APP_DIR" && npx oxlint --type-aware --format=unix src/oxlint-probe.tsx || true)"
rm "$PROBE"
for rule in "eslint(no-debugger)" "jsx-a11y(alt-text)" "e18e(prefer-array-at)" "react-doctor(effect-needs-cleanup)" "typescript(no-floating-promises)" "eslint(no-restricted-imports)"; do
  printf '%s\n' "$OXLINT_OUTPUT" | grep -qF "$rule" || fail "oxlint did not report $rule: $OXLINT_OUTPUT"
done
if printf '%s\n' "$OXLINT_OUTPUT" | grep -qF "react(react-in-jsx-scope)"; then
  fail "oxlint reports react-in-jsx-scope, but the template uses the automatic JSX runtime"
fi
echo "ok: oxlint runs the eslint, jsx-a11y, e18e, react-doctor, and type-aware rules"

step "Run the checks and npm audit at the same time"
# The test runs the parts of npm run check, so check the script text.
grep -qF '"check": "npm run format:check && npm run typecheck && npm run lint && npm run knip && npm run test"' "$APP_DIR/package.json" || fail "the check script changed: update this step"
# astro check writes .astro/types.d.ts, and the type-aware lint reads it, so lint
# starts after typecheck.
FIRST=("npm run format:check" "npm run typecheck" "npm run knip")
[ "$QUICK" -eq 1 ] || FIRST+=("npm audit --omit=dev --audit-level=high" "npm audit signatures")
run_parallel "${FIRST[@]}"
run_parallel "npm run lint" "npm run test"
if [ "$QUICK" -eq 1 ]; then
  echo
  echo "PASS: the template passes the checks ($STEP steps, --quick)"
  exit 0
fi

if [ "$FRESH" -eq 1 ]; then
  step "Run npm run check"
  (cd "$APP_DIR" && npm run check)
fi

step "Run npm run build"
(cd "$APP_DIR" && npm run build)

step "Run npm run size"
(cd "$APP_DIR" && npm run size)

step "Check the button in the built CSS"
grep -lqE 'opacity:(8%|\.08)' "$APP_DIR"/dist/client/_astro/*.css || fail "the built CSS has no hover state layer"
echo "ok: the built CSS has the state layer"

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

step "Check the button on the home page"
HOME_HTML="$(curl -s --max-time 30 "$BASE_URL/")"
printf '%s\n' "$HOME_HTML" | grep -q 'data-slot="button"' || fail "the home page has no Fulldev button"
printf '%s\n' "$HOME_HTML" | grep -q 'href="/posts"' || fail "the button does not link to /posts"
printf '%s\n' "$HOME_HTML" | grep -q 'before:bg-current' || fail "the button has no state layer"
echo "ok: the home page has the Material 3 button"

step "Check the security.txt file and the privacy page"
expect_status 200 "GET /.well-known/security.txt" "$BASE_URL/.well-known/security.txt"
SECURITY_TYPE="$(curl -s -o /dev/null -w '%{content_type}' --max-time 30 "$BASE_URL/.well-known/security.txt")"
[ "$SECURITY_TYPE" = "text/plain; charset=utf-8" ] || fail "security.txt content type: $SECURITY_TYPE"
SECURITY_TXT="$(curl -s --max-time 30 "$BASE_URL/.well-known/security.txt")"
for field in "Contact: mailto:security@example.com" "Expires: " "Canonical: https://example.com/.well-known/security.txt"; do
  printf '%s\n' "$SECURITY_TXT" | grep -qF "$field" || fail "security.txt has no \"$field\""
done
echo "ok: security.txt has the type and the fields"
expect_status 200 "GET /privacy" "$BASE_URL/privacy"
curl -s --max-time 30 "$BASE_URL/privacy" | grep -q 'Privacy policy' || fail "/privacy has no title"
curl -s --max-time 30 "$BASE_URL/" | grep -q 'href="/privacy"' || fail "the footer has no link to /privacy"
echo "ok: the privacy page exists, and the footer links to it"

echo
echo "PASS: the template works end to end ($STEP steps)"
