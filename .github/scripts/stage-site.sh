#!/usr/bin/env bash
# Copies the hub page (./index.html) and every top-level folder that contains an index.html
# into ./_site unchanged, so links behave the same locally and when deployed.
# Used by both the GitHub Pages workflow and netlify.toml.
set -euo pipefail

out="${1:-_site}"
rm -rf "$out"
mkdir -p "$out"

if [ ! -f index.html ]; then
  echo "Missing ./index.html (the hub page) - nothing to publish." >&2
  exit 1
fi
cp index.html "$out/"

count=0
for dir in */; do
  dir="${dir%/}"
  [ "$dir" = "$out" ] && continue
  [ -f "$dir/index.html" ] || continue
  cp -r "$dir" "$out/$dir"
  count=$((count + 1))
done

echo "Staged hub + $count simulation folder(s) into $out/:"
ls -1 "$out"
