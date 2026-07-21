#!/usr/bin/env bash
# shared hosting용 Vite 빌드 + public/ 배치 (Linux CI / GitHub Actions)
# Usage: bash scripts/build-dothome.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="${1:-$ROOT/preview/.env.dothome.example}"
LABEL="${2:-dothome}"
SKIP_INSTALL="${SKIP_INSTALL:-0}"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing env file: $ENV_FILE" >&2
  exit 1
fi

PREVIEW="$ROOT/preview"
PUBLIC="$ROOT/public"

copy_home_dist() {
  local dist_dir="$1"
  local target_dir="$2"
  mkdir -p "$target_dir"
  if [[ -f "$dist_dir/index.html" ]]; then
    cp -f "$dist_dir/index.html" "$target_dir/index.html"
  fi
  if [[ -d "$dist_dir/assets" ]]; then
    mkdir -p "$target_dir/assets"
    cp -rf "$dist_dir/assets/." "$target_dir/assets/"
  fi
  find "$dist_dir" -maxdepth 1 -type f ! -name 'index.html' -print0 | while IFS= read -r -d '' f; do
    cp -f "$f" "$target_dir/"
  done
}

copy_spa_dist() {
  local dist_dir="$1"
  local target_dir="$2"
  rm -rf "$target_dir"
  mkdir -p "$target_dir"
  cp -rf "$dist_dir/." "$target_dir/"
}

echo "== study114 shared hosting build ($LABEL) =="
echo "Env: $ENV_FILE"

build_one() {
  local name="$1"
  local base="$2"
  local target="$3"
  local pkg_dir="$PREVIEW/$name"
  local dist_dir="$pkg_dir/dist"

  if [[ "$SKIP_INSTALL" != "1" ]]; then
    echo "[$name] npm install"
    (cd "$pkg_dir" && npm install --no-fund --no-audit)
  fi

  cp -f "$ENV_FILE" "$pkg_dir/.env.production.local"
  echo "[$name] vite build (base=$base)"
  (
    cd "$pkg_dir"
    export VITE_BASE_PATH="$base"
    npm run build
  )

  if [[ "$name" == "home-ui" ]]; then
    copy_home_dist "$dist_dir" "$target"
  else
    copy_spa_dist "$dist_dir" "$target"
  fi
  echo "[$name] -> $target"
}

build_one home-ui '/' "$PUBLIC"
build_one auth-ui '/auth/' "$PUBLIC/auth"
build_one search-ui '/search/' "$PUBLIC/search"
build_one study-room-ui '/register/room/' "$PUBLIC/register/room"
build_one tutor-ui '/register/tutor/' "$PUBLIC/register/tutor"

echo
echo "Done. See docs/internal/01-dothome-deploy.md for FTP upload paths."
