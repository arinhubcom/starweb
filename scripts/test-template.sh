#!/usr/bin/env bash
# Test the Starweb template end to end: create a project from template/ with
# setup.mjs, check that update.mjs has nothing to change, run the checks and
# the build, then test the built Worker.
# Usage: bash scripts/test-template.sh <workdir> [--quick] [--fresh]
# --quick stops after the checks, to iterate. It does not replace the full run.
# --fresh skips the template lockfile and runs the pnpm run check script in order.
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
  output="$(cd "$APP_DIR" && pnpm run preview --port "$port" --background 2>&1)"
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
# A parent repository that ignores all files, as a home folder with dotfiles
# can be. Oxfmt reads its ignore rules until the project has its own repository.
git -C "$WORKDIR" init --quiet
printf '*\n' > "$WORKDIR/.gitignore"
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
[ -f "$APP_DIR/rules/LICENSE" ] || fail "the project has no rules/LICENSE"
cmp -s "$REPO_ROOT/LICENSE" "$APP_DIR/rules/LICENSE" || fail "LICENSE and rules/LICENSE differ"
[ ! -e "$APP_DIR/LICENSE" ] || fail "the project has a root LICENSE, which belongs to the project owner"
[ ! -e "$APP_DIR/template" ] || fail "the project has a template folder"
[ ! -e "$APP_DIR/files" ] || fail "the project has a files folder"
[ ! -e "$REPO_ROOT/template/.env" ] || fail "template/ has an .env file"
grep -qE '^EMDASH_ENCRYPTION_KEY=emdash_enc_v1_[A-Za-z0-9_-]{43}$' "$APP_DIR/.env" || fail ".env has no encryption key"
grep -q '"name": "tpl-test"' "$APP_DIR/package.json" || fail "package.json has the wrong name"
if grep -q '"create-emdash"' "$APP_DIR/package.json"; then
  fail "package.json has create-emdash, which only the Starweb repository uses"
fi
[ -f "$APP_DIR/pnpm-lock.yaml" ] || fail "the project has no pnpm-lock.yaml"
[ ! -e "$APP_DIR/package-lock.json" ] || fail "the project has package-lock.json"
# A pinned pnpm version gives a lockfile with two YAML documents, and the
# dependency graph of GitHub cannot read it: rules/DEPS.md (Install).
if grep -q '"packageManager"\|"devEngines"' "$APP_DIR/package.json"; then
  fail "package.json pins pnpm"
fi
if grep -q '^---$' "$APP_DIR/pnpm-lock.yaml"; then
  fail "pnpm-lock.yaml has more than one YAML document"
fi
grep -qE '^  zod: [0-9]+\.[0-9]+\.[0-9]+$' "$APP_DIR/pnpm-workspace.yaml" || fail "the zod catalog entry has no exact version"
# One copy of a package has two lines: packages and snapshots.
[ "$(grep -cE '^  zod@' "$APP_DIR/pnpm-lock.yaml")" = "2" ] || fail "the project has more than one copy of zod"
grep -q '^minimumReleaseAge: 4320$' "$APP_DIR/pnpm-workspace.yaml" || fail "pnpm-workspace.yaml has no 3 day release age"
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
(cd "$APP_DIR" && pnpm exec tsx scripts/theme.ts)
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
OXLINT_OUTPUT="$(cd "$APP_DIR" && pnpm exec oxlint --type-aware --format=unix src/oxlint-probe.tsx || true)"
rm "$PROBE"
for rule in "eslint(no-debugger)" "jsx-a11y(alt-text)" "e18e(prefer-array-at)" "react-doctor(effect-needs-cleanup)" "typescript(no-floating-promises)" "eslint(no-restricted-imports)"; do
  printf '%s\n' "$OXLINT_OUTPUT" | grep -qF "$rule" || fail "oxlint did not report $rule: $OXLINT_OUTPUT"
done
if printf '%s\n' "$OXLINT_OUTPUT" | grep -qF "react(react-in-jsx-scope)"; then
  fail "oxlint reports react-in-jsx-scope, but the template uses the automatic JSX runtime"
fi
echo "ok: oxlint runs the eslint, jsx-a11y, e18e, react-doctor, and type-aware rules"

step "Check that Oxfmt formats Astro files and sorts Tailwind classes"
FORMAT_PROBE="$APP_DIR/src/format-probe.astro"
TV_PROBE="$APP_DIR/src/format-probe.ts"
# A token class sorts first when Oxfmt does not read global.css, so the first
# probe proves the stylesheet option. The tv() probe proves the functions option.
printf '<div class="p-4 flex bg-surface-container"></div>\n' > "$FORMAT_PROBE"
printf 'export const probe = tv({ base: "p-4 flex" });\n' > "$TV_PROBE"
(cd "$APP_DIR" && pnpm exec oxfmt src/format-probe.astro src/format-probe.ts) || { rm -f "$FORMAT_PROBE" "$TV_PROBE"; fail "oxfmt failed on the probe files"; }
FORMAT_RESULT="$(cat "$FORMAT_PROBE")"
TV_RESULT="$(cat "$TV_PROBE")"
rm "$FORMAT_PROBE" "$TV_PROBE"
[ "$FORMAT_RESULT" = '<div class="flex bg-surface-container p-4"></div>' ] || fail "oxfmt did not sort the Tailwind classes with the theme tokens: $FORMAT_RESULT"
printf '%s' "$TV_RESULT" | grep -qF 'tv({ base: "flex p-4" })' || fail "oxfmt did not sort the classes in tv(): $TV_RESULT"
echo "ok: oxfmt formats .astro files, knows the theme tokens, and sorts classes in tv()"

step "Check that Material Symbols is the only icon source"
[ -f "$APP_DIR/src/components/ui/material-icon/material-icon.astro" ] || fail "the project has no MaterialIcon"
[ -f "$APP_DIR/src/components/ui/react/material-icon.tsx" ] || fail "the project has no React MaterialIcon"
[ ! -e "$APP_DIR/src/components/ui/icon" ] || fail "src/components/ui/icon collides with @fulldev/icon"
if grep -rqE 'lucide|simple-icons' "$APP_DIR/src" "$APP_DIR/package.json"; then
  fail "the project uses an icon package, not Material Symbols"
fi
ASTRO_PROBE="$APP_DIR/src/icon-probe.astro"
REACT_PROBE="$APP_DIR/src/icon-probe.tsx"
printf -- '---\nimport CheckIcon from "@lucide/astro/icons/check";\n---\n\n<CheckIcon />\n' > "$ASTRO_PROBE"
printf 'import { CheckIcon } from "lucide-react";\n\nexport const Probe = () => <CheckIcon />;\n' > "$REACT_PROBE"
ICON_LINT="$(cd "$APP_DIR" && pnpm exec oxlint --format=unix src/icon-probe.astro src/icon-probe.tsx || true)"
rm "$ASTRO_PROBE" "$REACT_PROBE"
for import in "@lucide/astro/icons/check" "lucide-react"; do
  printf '%s\n' "$ICON_LINT" | grep -qF "'$import' import is restricted" || fail "oxlint did not report $import: $ICON_LINT"
done
echo "ok: MaterialIcon exists, and oxlint fails on Lucide in .astro and .tsx files"

step "Check set-secrets with --dry-run and no real gh or Wrangler call"
SECRETS_MARKER="MARKER-$$-do-not-print"
SECRETS_OUT="$(printf 'BETTER_AUTH_SECRET=%s\nSENTRY_AUTH_TOKEN=%s\n' "$SECRETS_MARKER" "$SECRETS_MARKER" | (cd "$APP_DIR" && pnpm run --silent set-secrets production --dry-run 2>&1))" || fail "set-secrets --dry-run failed: $SECRETS_OUT"
printf '%s\n' "$SECRETS_OUT" | grep -q 'BETTER_AUTH_SECRET' || fail "set-secrets --dry-run does not list BETTER_AUTH_SECRET"
printf '%s\n' "$SECRETS_OUT" | grep -q 'SENTRY_AUTH_TOKEN' || fail "set-secrets --dry-run does not list SENTRY_AUTH_TOKEN"
if printf '%s\n' "$SECRETS_OUT" | grep -qF "$SECRETS_MARKER"; then fail "set-secrets --dry-run printed a value"; fi
if SECRETS_BAD="$(printf 'NOT_A_SECRET=%s\n' "$SECRETS_MARKER" | (cd "$APP_DIR" && pnpm run --silent set-secrets dev --dry-run 2>&1))"; then
  fail "set-secrets accepted an unknown name"
fi
if printf '%s\n' "$SECRETS_BAD" | grep -qF "$SECRETS_MARKER"; then fail "set-secrets printed the value of an unknown name"; fi
printf '%s\n' "$SECRETS_BAD" | grep -q 'NOT_A_SECRET' || fail "set-secrets does not name the unknown secret"
echo "ok: set-secrets --dry-run lists names, prints no value, and rejects an unknown name"

step "Run the checks and pnpm audit at the same time"
# An installed agent skill can hold example files that no code imports.
mkdir -p "$APP_DIR/.agents/skills/test-skill"
printf 'export const example = 1;\n' > "$APP_DIR/.agents/skills/test-skill/example.tsx"
# The test runs the parts of pnpm run check, so check the script text.
grep -qF '"check": "pnpm run format:check && pnpm run typecheck && pnpm run lint && pnpm run knip && pnpm run test"' "$APP_DIR/package.json" || fail "the check script changed: update this step"
# astro check writes .astro/types.d.ts, and the type-aware lint reads it, so lint
# starts after typecheck.
FIRST=("pnpm run format:check" "pnpm run typecheck" "pnpm run knip" "pnpm run fonts")
[ "$QUICK" -eq 1 ] || FIRST+=("pnpm audit --prod --audit-level high" "pnpm audit signatures")
run_parallel "${FIRST[@]}"
run_parallel "pnpm run lint" "pnpm run test"
if [ "$QUICK" -eq 1 ]; then
  echo
  echo "PASS: the template passes the checks ($STEP steps, --quick)"
  exit 0
fi

if [ "$FRESH" -eq 1 ]; then
  step "Run pnpm run check"
  (cd "$APP_DIR" && pnpm run check)
fi

step "Run pnpm run build"
(cd "$APP_DIR" && pnpm run build)

step "Run pnpm run size"
(cd "$APP_DIR" && pnpm run size)

step "Run pnpm run lighthouse"
LH_WORKFLOW="$APP_DIR/.github/workflows/lighthouse.yml"
grep -q 'run: pnpm run lighthouse' "$LH_WORKFLOW" || fail "lighthouse.yml does not run pnpm run lighthouse"
grep -q 'cancel-in-progress: true' "$LH_WORKFLOW" || fail "lighthouse.yml does not cancel older runs"
grep -q '^    paths:' "$LH_WORKFLOW" || fail "lighthouse.yml has no paths filter"
grep -q '"numberOfRuns": 3' "$APP_DIR/lighthouserc.json" || fail "lighthouserc.json does not take 3 runs"
# The lhci server uses port 4322. The preview of this script uses 4501 or higher,
# and it starts later.
if [ -z "${CHROME_PATH:-}" ] && ! command -v google-chrome >/dev/null && ! command -v chromium >/dev/null && ! command -v chrome >/dev/null; then
  echo "skip: no Chrome found (set CHROME_PATH to run Lighthouse)"
else
  # In Actions mode, a score below 100 is a warning and not a failure.
  (cd "$APP_DIR" && GITHUB_ACTIONS=true pnpm run lighthouse) || fail "pnpm run lighthouse failed"
  [ -f "$APP_DIR/.lighthouseci/out/manifest.json" ] || fail "lighthouse wrote no manifest"
  if curl -s -o /dev/null --max-time 2 "http://localhost:4322/"; then
    fail "port 4322 still listens after pnpm run lighthouse"
  fi
  echo "ok: pnpm run lighthouse ran and left port 4322 free"
fi

step "Check the button in the built CSS"
grep -lqE 'opacity:(8%|\.08)' "$APP_DIR"/dist/client/_astro/*.css || fail "the built CSS has no hover state layer"
echo "ok: the built CSS has the state layer"

step "Start pnpm run preview"
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

step "Check the Forms and Field Kit plugins"
grep -q 'plugins: \[fieldKitPlugin(), formsPlugin()\]' "$APP_DIR/astro.config.mjs" || fail "astro.config.mjs does not load the plugins"
grep -q '"name": "FORMS_LIMITER"' "$APP_DIR/wrangler.jsonc" || fail "wrangler.jsonc has no FORMS_LIMITER binding"
printf '%s\n' "$CSP" | grep -q 'frame-src https://challenges.cloudflare.com' || fail "CSP does not allow the Turnstile frame"
printf '%s\n' "$CSP" | grep -qE "script-src [^;]*https://challenges.cloudflare.com" || fail "CSP does not allow the Turnstile script"
FORMS_API="$BASE_URL/_emdash/api/plugins/emdash-forms"
expect_status 400 "POST forms/create with the admin defaults" -X POST \
  -H "Origin: $BASE_URL" -H 'Content-Type: application/json' -H 'X-EmDash-Request: 1' \
  --data '{"settings":{"retentionDays":0,"spamProtection":"honeypot"}}' "$FORMS_API/forms/create"
expect_status 401 "POST forms/create without a session" -X POST \
  -H "Origin: $BASE_URL" -H 'Content-Type: application/json' -H 'X-EmDash-Request: 1' \
  --data '{"settings":{"retentionDays":30,"spamProtection":"turnstile"}}' "$FORMS_API/forms/create"
LIMIT_STATUS=""
for _ in $(seq 1 11); do
  LIMIT_STATUS="$(status_of -X POST -H 'Content-Type: application/json' -H 'CF-Connecting-IP: 203.0.113.7' \
    --data '{"formId":"none","data":{}}' "$FORMS_API/submit")"
done
[ "$LIMIT_STATUS" = "429" ] || fail "the 11th POST submit returned $LIMIT_STATUS, not 429"
expect_status 429 "PATCH submit shares the rate limit" -X PATCH -H 'Content-Type: application/json' \
  -H 'CF-Connecting-IP: 203.0.113.7' --data '{"formId":"none","data":{}}' "$FORMS_API/submit"
expect_status 400 "PATCH forms/update away from Turnstile" -X PATCH \
  -H "Origin: $BASE_URL" -H 'Content-Type: application/json' -H 'X-EmDash-Request: 1' \
  --data '{"id":"1","settings":{"spamProtection":"none"}}' "$FORMS_API/forms/update"
curl -s --max-time 30 "$BASE_URL/privacy" | grep -q 'Form submissions: up to 365 days' || fail "/privacy does not state the form retention"
echo "ok: plugins load, policy and rate limit apply, and the privacy page states the retention"

step "Check the button on the home page"
HOME_HTML="$(curl -s --max-time 30 "$BASE_URL/")"
printf '%s\n' "$HOME_HTML" | grep -q 'data-slot="button"' || fail "the home page has no Fulldev button"
printf '%s\n' "$HOME_HTML" | grep -q 'href="/posts"' || fail "the button does not link to /posts"
printf '%s\n' "$HOME_HTML" | grep -q 'before:bg-current' || fail "the button has no state layer"
echo "ok: the home page has the Material 3 button"

step "Check the fonts and the icon on the home page"
printf '%s\n' "$HOME_HTML" | grep -q -- '--font-roboto-flex:' || fail "the home page has no text font"
printf '%s\n' "$HOME_HTML" | grep -q -- '--font-material-symbols:' || fail "the home page has no icon font"
printf '%s\n' "$HOME_HTML" | grep -q 'data-slot="material-icon"' || fail "the home page has no icon"
if printf '%s\n' "$HOME_HTML" | grep -qE 'fonts\.(googleapis|gstatic)\.com'; then
  fail "the home page loads a font from Google"
fi
ICON_FACE="$(printf '%s\n' "$HOME_HTML" | grep -oE 'Material Symbols Outlined[^;]*";src:url\("/_astro/fonts/[a-z0-9]+\.woff2' | head -1 || true)"
ICON_FILE="${ICON_FACE##*url(\"}"
[ -n "$ICON_FILE" ] || fail "the icon font has no local file"
expect_status 200 "GET the icon font" "$BASE_URL$ICON_FILE"
ICON_SIZE="$(curl -s -o /dev/null -w '%{size_download}' --max-time 30 "$BASE_URL$ICON_FILE")"
[ "$ICON_SIZE" -lt 100000 ] || fail "the icon font has $ICON_SIZE bytes: it is not a subset"
ICON_CACHE="$(curl -s -D - -o /dev/null --max-time 30 "$BASE_URL$ICON_FILE" | grep -i '^cache-control:' || true)"
printf '%s\n' "$ICON_CACHE" | grep -q 'immutable' || fail "the icon font is not immutable: $ICON_CACHE"
grep -q 'path: node_modules/.astro/fonts' "$APP_DIR/.github/workflows/ci.yml" || fail "ci.yml does not cache the fonts"
grep -q 'run: pnpm run fonts' "$APP_DIR/.github/workflows/fonts.yml" || fail "fonts.yml does not run the font check"
grep -q 'src/lib/fonts.ts' "$APP_DIR/.github/workflows/fonts.yml" || fail "fonts.yml does not watch src/lib/fonts.ts"
echo "ok: self-hosted, immutable fonts, cached in CI, and an icon font subset of $ICON_SIZE bytes"
grep -q 'run: pnpm run pagespeed' "$APP_DIR/.github/workflows/perf.yml" || fail "perf.yml does not run the PageSpeed check"
grep -q 'pnpm run worker-cpu "\$PRODUCTION_WORKER"' "$APP_DIR/.github/workflows/perf.yml" || fail "perf.yml does not run the Worker CPU check"
[ "$(grep -c '^ *deployment: false' "$APP_DIR/.github/workflows/perf.yml")" -eq 2 ] || fail "perf.yml does not read both jobs' tokens from the environment without a deployment"
grep -q "cron: \"0 4 \* \* \*\"" "$APP_DIR/.github/workflows/perf.yml" || fail "perf.yml does not run daily at 04:00 UTC"
PAGESPEED_OUT="$(cd "$APP_DIR" && env -u PAGESPEED_API_KEY pnpm run pagespeed 2>&1 || true)"
printf '%s\n' "$PAGESPEED_OUT" | grep -q 'PAGESPEED_API_KEY is not set' || fail "pnpm run pagespeed without a key did not name PAGESPEED_API_KEY: $PAGESPEED_OUT"
CPU_OUT="$(cd "$APP_DIR" && env -u CLOUDFLARE_ACCOUNT_ID -u CLOUDFLARE_OBSERVABILITY_TOKEN pnpm run worker-cpu x 2>&1 || true)"
printf '%s\n' "$CPU_OUT" | grep -q 'CLOUDFLARE_ACCOUNT_ID is not set' || fail "pnpm run worker-cpu without env did not name CLOUDFLARE_ACCOUNT_ID: $CPU_OUT"
CPU_OUT="$(cd "$APP_DIR" && CLOUDFLARE_ACCOUNT_ID=a CLOUDFLARE_OBSERVABILITY_TOKEN= pnpm run worker-cpu x 2>&1 || true)"
printf '%s\n' "$CPU_OUT" | grep -q 'CLOUDFLARE_OBSERVABILITY_TOKEN is not set' || fail "pnpm run worker-cpu without a token did not name CLOUDFLARE_OBSERVABILITY_TOKEN: $CPU_OUT"
SECRET_OUT="$(cd "$APP_DIR" && PAGESPEED_API_KEY=SECRET-KEY-123 pnpm run pagespeed not-a-url 2>&1 || true)"
printf '%s\n' "$SECRET_OUT" | grep -q 'SECRET-KEY-123' && fail "pnpm run pagespeed printed the API key"
echo "ok: perf.yml runs both checks daily, and each check names its missing variable and prints no secret"

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
