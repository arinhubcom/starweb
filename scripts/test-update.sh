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
      [ -f "$REPO_ROOT/$file" ] || continue
      mkdir -p "$STARWEB/$(dirname "$file")"
      cp -p "$REPO_ROOT/$file" "$STARWEB/$file"
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

step "Create the starter project with the pinned create-emdash"
VERSION="$(node -p 'require(process.argv[1]).devDependencies["create-emdash"]' "$STARWEB/template/package.json")"
[ -n "$VERSION" ] || fail "template/package.json has no create-emdash"
(cd "$WORKDIR" && npm create "emdash@$VERSION" app -- --template cloudflare:starter --install --yes)

step "Run setup.mjs of the clone"
node "$STARWEB/scripts/setup.mjs" "$APP" --name upd-test --site https://example.com
BASE_COMMIT="$(clone_git rev-parse HEAD)"
assert_equal "$(state_commit)" "$BASE_COMMIT" ".starweb.json commit"

step "Change Starweb: a rule line, a template file, and two scripts"
sed -i '7s/$/ (upstream)/' "$STARWEB/rules/DEV.md"
printf '// upstream change\n' >>"$STARWEB/template/files/test/setup.ts"
edit_package_json "$STARWEB/template/package.json" starweb-test "echo starweb-test"
edit_package_json "$STARWEB/template/package.json" lint "eslint . --max-warnings 0 --cache"
commit_in_clone "test: change a rule, a template file, and scripts"
NEW_COMMIT="$(clone_git rev-parse HEAD)"

step "Change the project: another line of the same rule file, and the lint script"
sed -i '13s/$/ (project)/' "$APP/rules/DEV.md"
edit_package_json "$APP/package.json" lint "eslint . --max-warnings 5"

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
assert_contains "$APP/package.json" '"lint": "eslint . --max-warnings 5"'
assert_equal "$(state_commit)" "$NEW_COMMIT" ".starweb.json commit"

step "Run update.mjs again: nothing to change"
AGAIN_OUTPUT="$(node "$STARWEB/scripts/update.mjs" "$APP" --dry-run)"
if printf '%s\n' "$AGAIN_OUTPUT" | grep -E '^[A-Za-z].*: [1-9][0-9]*$'; then
  fail "update.mjs reports changes after a finished update"
fi

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

echo
echo "PASS: update.mjs merges Starweb changes into a project ($STEP steps)"
