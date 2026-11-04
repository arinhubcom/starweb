#!/usr/bin/env bash
# Test scripts/update.mjs end to end: clone Starweb, set up a project from the
# pinned starter, change Starweb and the project, then run update.mjs and check
# the three-way merge, the package.json rules, and the conflict markers.
# Usage: bash scripts/test-update.sh <workdir>
set -euo pipefail

if [ "$#" -ne 1 ]; then
  echo "Usage: bash scripts/test-update.sh <workdir>" >&2
  exit 2
fi

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WORKDIR="$(mkdir -p "$1" && cd "$1" && pwd)"
STARWEB="$WORKDIR/starweb"
APP="$WORKDIR/app"
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

# Run git in the test clone with a fixed identity.
clone_git() {
  git -c user.name=starweb-test -c user.email=test@example.com -C "$STARWEB" "$@"
}

commit_in_clone() {
  clone_git add -A
  clone_git commit --quiet -m "$1"
}

state_commit() {
  node -p 'require(process.argv[1]).commit' "$APP/.starweb.json"
}

assert_contains() {
  grep -qF -- "$2" "$1" || fail "$1 does not contain: $2"
  echo "ok: $1 contains: $2"
}

assert_not_contains() {
  if grep -qF -- "$2" "$1"; then fail "$1 contains: $2"; fi
  echo "ok: $1 does not contain: $2"
}

assert_equal() {
  [ "$1" = "$2" ] || fail "$3: expected $2, got $1"
  echo "ok: $3 ($1)"
}

# Copy the working tree of this repository over the clone, so that the test
# uses the uncommitted state too. The commit exists in the clone only.
sync_worktree_to_clone() {
  find "$STARWEB" -mindepth 1 -maxdepth 1 ! -name .git -exec rm -rf {} +
  (cd "$REPO_ROOT" && git ls-files -co --exclude-standard -z) |
    while IFS= read -r -d '' file; do
      [ -f "$REPO_ROOT/$file" ] || [ -L "$REPO_ROOT/$file" ] || continue
      mkdir -p "$STARWEB/$(dirname "$file")"
      cp -pP "$REPO_ROOT/$file" "$STARWEB/$file"
    done
  if [ -n "$(clone_git status --porcelain)" ]; then
    commit_in_clone "test: working tree of the repository"
  fi
}

edit_package_json() {
  node -e '
    const fs = require("node:fs");
    const [file, script, value] = process.argv.slice(1);
    const pkg = JSON.parse(fs.readFileSync(file, "utf8"));
    pkg.scripts[script] = value;
    fs.writeFileSync(file, JSON.stringify(pkg, null, 2) + "\n");
  ' "$@"
}

step "Clone Starweb and copy the working tree into the clone"
rm -rf "$STARWEB" "$APP"
git clone --quiet --no-hardlinks "$REPO_ROOT" "$STARWEB"
sync_worktree_to_clone
echo "clone at $(clone_git rev-parse --short HEAD)"

step "Run setup.mjs of the clone"
node "$STARWEB/scripts/setup.mjs" "$APP" --name upd-test --site https://example.com
BASE_COMMIT="$(clone_git rev-parse HEAD)"
assert_equal "$(state_commit)" "$BASE_COMMIT" ".starweb.json commit"

step "Change Starweb: a rule line, a template file, and two scripts"
sed -i '7s/$/ (upstream)/' "$STARWEB/rules/DEV.md"
printf '// upstream change\n' >>"$STARWEB/template/test/setup.ts"
edit_package_json "$STARWEB/template/package.json" starweb-test "echo starweb-test"
edit_package_json "$STARWEB/template/package.json" lint "oxlint --type-aware --max-warnings 0 --quiet"
commit_in_clone "test: change a rule, a template file, and scripts"
NEW_COMMIT="$(clone_git rev-parse HEAD)"

step "Change the project: another line of the same rule file, and the lint script"
sed -i '13s/$/ (project)/' "$APP/rules/DEV.md"
edit_package_json "$APP/package.json" lint "oxlint --type-aware --max-warnings 5"

step "Run update.mjs --dry-run: it changes nothing"
DRY_OUTPUT="$(node "$STARWEB/scripts/update.mjs" "$APP" --dry-run)"
printf '%s\n' "$DRY_OUTPUT"
printf '%s\n' "$DRY_OUTPUT" | grep -q 'test/setup.ts' || fail "the plan does not list test/setup.ts"
printf '%s\n' "$DRY_OUTPUT" | grep -q 'rules/DEV.md' || fail "the plan does not list rules/DEV.md"
assert_not_contains "$APP/test/setup.ts" "// upstream change"
assert_not_contains "$APP/rules/DEV.md" "(upstream)"
assert_equal "$(state_commit)" "$BASE_COMMIT" ".starweb.json commit after the dry run"

step "Run update.mjs: a clean merge"
node "$STARWEB/scripts/update.mjs" "$APP"
assert_contains "$APP/test/setup.ts" "// upstream change"
assert_contains "$APP/rules/DEV.md" "(upstream)"
assert_contains "$APP/rules/DEV.md" "(project)"
assert_not_contains "$APP/rules/DEV.md" "<<<<<<<"
assert_contains "$APP/package.json" '"starweb-test": "echo starweb-test"'
assert_contains "$APP/package.json" '"lint": "oxlint --type-aware --max-warnings 5"'
assert_equal "$(state_commit)" "$NEW_COMMIT" ".starweb.json commit"

step "Run update.mjs again: nothing to change"
AGAIN_OUTPUT="$(node "$STARWEB/scripts/update.mjs" "$APP" --dry-run)"
if printf '%s\n' "$AGAIN_OUTPUT" | grep -E '^[A-Za-z].*: [1-9][0-9]*$'; then
  fail "update.mjs reports changes after a finished update"
fi

step "Update a project whose commit has the old layout: template/files, no starter"
LEGACY_COMMIT=c75cbad
node -e '
  const fs = require("node:fs");
  const [file, commit] = process.argv.slice(1);
  const state = JSON.parse(fs.readFileSync(file, "utf8"));
  fs.writeFileSync(file, JSON.stringify({ ...state, commit }, null, 2) + "\n");
' "$APP/.starweb.json" "$(clone_git rev-parse "$LEGACY_COMMIT")"
printf '// flat upstream change\n' >>"$STARWEB/template/test/decode.test.ts"
printf '\n<!-- starter upstream change -->\n' >>"$STARWEB/template/EMDASH.md"
commit_in_clone "test: change a template file and a starter file"
NEW_COMMIT="$(clone_git rev-parse HEAD)"
sed -i '1s/^/\/\/ project change\n/' "$APP/test/decode.test.ts"
LEGACY_OUTPUT="$(node "$STARWEB/scripts/update.mjs" "$APP")"
printf '%s\n' "$LEGACY_OUTPUT"
assert_contains "$APP/test/decode.test.ts" "// project change"
assert_contains "$APP/test/decode.test.ts" "// flat upstream change"
assert_not_contains "$APP/test/decode.test.ts" "<<<<<<<"
assert_not_contains "$APP/EMDASH.md" "starter upstream change"
[ -L "$APP/.claude/skills" ] || fail "update.mjs replaced the symbolic link"
[ ! -e "$APP/files" ] || fail "update.mjs created a files folder"
[ ! -e "$APP/template" ] || fail "update.mjs created a template folder"
assert_equal "$(state_commit)" "$NEW_COMMIT" ".starweb.json commit after the layout change"

step "Change a starter file in Starweb: update.mjs brings it into a new project"
sed -i '1s/^/<!-- second starter change -->\n/' "$STARWEB/template/EMDASH.md"
commit_in_clone "test: change a starter file again"
NEW_COMMIT="$(clone_git rev-parse HEAD)"
node "$STARWEB/scripts/update.mjs" "$APP"
assert_contains "$APP/EMDASH.md" "second starter change"
assert_equal "$(state_commit)" "$NEW_COMMIT" ".starweb.json commit after a starter change"

step "Change the same line in Starweb and in the project: a conflict"
sed -i '10s/$/ UPSTREAM-A/' "$STARWEB/rules/DEV.md"
commit_in_clone "test: change a rule line"
sed -i '10s/$/ PROJECT-B/' "$APP/rules/DEV.md"
set +e
node "$STARWEB/scripts/update.mjs" "$APP"
CONFLICT_STATUS=$?
set -e
assert_equal "$CONFLICT_STATUS" "1" "update.mjs exit code with a conflict"
assert_contains "$APP/rules/DEV.md" "<<<<<<< project"
assert_contains "$APP/rules/DEV.md" "||||||| base"
assert_contains "$APP/rules/DEV.md" ">>>>>>> starweb"
assert_equal "$(state_commit)" "$NEW_COMMIT" ".starweb.json commit after a conflict"

step "Run update-starter.mjs: merge a starter change into template/"
PINNED="$(node -p 'require(process.argv[1]).devDependencies["create-emdash"]' "$STARWEB/package.json")"
# Fake an older snapshot. In 404.astro the template equals the snapshot, and in
# Base.astro the template has its own changes. The new output has no such line.
for file in src/pages/404.astro src/layouts/Base.astro; do
  for folder in starter template; do
    sed -i '$a <!-- only in the old starter -->' "$STARWEB/$folder/$file"
  done
done
rm "$STARWEB/starter/seed/seed.json"
commit_in_clone "test: fake an older starter snapshot"
CHECK_STATUS=0
CHECK_OUTPUT="$(node "$STARWEB/scripts/update-starter.mjs" --check)" || CHECK_STATUS=$?
printf '%s\n' "$CHECK_OUTPUT"
assert_equal "$CHECK_STATUS" "3" "update-starter.mjs --check exit code with changes"
printf '%s\n' "$CHECK_OUTPUT" | grep -q 'src/layouts/Base.astro' || fail "--check does not list Base.astro"
printf '%s\n' "$CHECK_OUTPUT" | grep -q 'seed/seed.json' || fail "--check does not list seed.json"
[ -z "$(clone_git status --porcelain)" ] || fail "--check changed files"
node -e '
  const fs = require("node:fs");
  const file = process.argv[1];
  const pkg = JSON.parse(fs.readFileSync(file, "utf8"));
  pkg.devDependencies["create-emdash"] = "0.0.1";
  fs.writeFileSync(file, JSON.stringify(pkg, null, 2) + "\n");
' "$STARWEB/package.json"
commit_in_clone "test: fake an older create-emdash pin"
STARTER_OUTPUT="$(node "$STARWEB/scripts/update-starter.mjs" "$PINNED")"
printf '%s\n' "$STARTER_OUTPUT"
assert_contains "$STARWEB/package.json" "\"create-emdash\": \"$PINNED\""
assert_not_contains "$STARWEB/template/package.json" "create-emdash"
assert_not_contains "$STARWEB/template/src/pages/404.astro" "only in the old starter"
assert_not_contains "$STARWEB/template/src/layouts/Base.astro" "only in the old starter"
assert_contains "$STARWEB/template/src/layouts/Base.astro" "themeScript"
assert_not_contains "$STARWEB/starter/src/layouts/Base.astro" "themeScript"
[ -f "$STARWEB/starter/seed/seed.json" ] || fail "starter/ has no new seed file"
for path in .env AGENTS.md pnpm-workspace.yaml worker-configuration.d.ts; do
  [ ! -e "$STARWEB/template/$path" ] || fail "update-starter.mjs wrote template/$path"
  [ ! -e "$STARWEB/starter/$path" ] || fail "update-starter.mjs wrote starter/$path"
done
[ ! -e "$STARWEB/starter/package-lock.json" ] || fail "update-starter.mjs wrote starter/package-lock.json"
[ -f "$STARWEB/template/package-lock.json" ] || fail "update-starter.mjs removed template/package-lock.json"
printf '%s\n' "$STARTER_OUTPUT" | grep -q '^Conflicts: 0$' || fail "update-starter.mjs reports conflicts"
if node "$STARWEB/scripts/update-starter.mjs" "$PINNED" >/dev/null 2>&1; then
  fail "update-starter.mjs ran with uncommitted changes"
fi

echo
echo "PASS: update.mjs merges Starweb changes into a project ($STEP steps)"
