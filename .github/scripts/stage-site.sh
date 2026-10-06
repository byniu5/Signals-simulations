#!/usr/bin/env bash
# Collects every top-level folder that contains an index.html into ./_site, ready for GitHub Pages.
#   "beam forming/index.html"  ->  _site/beam-forming/index.html   (URL-friendly slug: lowercase, spaces -> '-')
# A landing page is generated at _site/index.html; while there is only one demo it redirects straight to it.
set -euo pipefail

out="${1:-_site}"
rm -rf "$out"
mkdir -p "$out"

links=""
count=0
last_slug=""

for dir in */; do
  dir="${dir%/}"
  [ "$dir" = "$out" ] && continue
  [ -f "$dir/index.html" ] || continue

  slug="$(printf '%s' "$dir" | tr '[:upper:] ' '[:lower:]-')"
  cp -r "$dir" "$out/$slug"
  links+="<li><a href=\"$slug/\">$dir</a></li>"$'\n'
  count=$((count + 1))
  last_slug="$slug"
done

if [ "$count" -eq 0 ]; then
  echo "No folder with an index.html found - nothing to publish." >&2
  exit 1
fi

refresh=""
[ "$count" -eq 1 ] && refresh="<meta http-equiv=\"refresh\" content=\"0; url=$last_slug/\">"

cat > "$out/index.html" <<EOF
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Signals simulations</title>
$refresh
<style>
  body { margin: 0; padding: 40px 20px; background: #0a0e16; color: #e6eaf2; font: 16px/1.6 system-ui, sans-serif; }
  main { max-width: 640px; margin: 0 auto; }
  a { color: #38bdf8; }
</style>
</head>
<body>
<main>
<h1>Signals simulations</h1>
<ul>
$links</ul>
</main>
</body>
</html>
EOF

echo "Staged $count demo(s) into $out/:"
ls -1 "$out"
