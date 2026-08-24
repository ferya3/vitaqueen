#!/usr/bin/env bash
#
# Fetch the IRANYekan webfont into apps/web/public/fonts/iranyekan/.
#
# IRANYekan is proprietary. Its own stylesheet header says so:
#
#     Copyright: Commercial/Proprietary Software — fontiran.com
#
# That is why the files are not committed. Whether this factory is licensed to
# use them on its website is a decision for the business, not for a build
# script, and fontiran.com is where that is settled. This script only puts
# files a licensed user already has the right to use in the place the site
# expects them.
#
# Until it is run the site renders in Vazirmatn, which is free, open, and was
# drawn as the Persian alternative to exactly this font.
#
#   bash infra/scripts/fetch-iranyekan.sh
#
# Re-running is safe; it overwrites what is there.

set -euo pipefail

# The published webfont package. Override to install from a copy of your own —
# a licensed download from fontiran.com, an internal mirror, a local tarball.
SOURCE="${IRANYEKAN_SOURCE:-https://registry.npmjs.org/@alibaba-aero/iranyekan/-/iranyekan-0.0.1.tgz}"

BOLD=$'\033[1m'
DIM=$'\033[2m'
YELLOW=$'\033[33m'
RESET=$'\033[0m'

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
target="${root}/apps/web/public/fonts/iranyekan"

# The five cuts bound to weights 300–700 by the @font-face block in
# `apps/web/src/app/globals.css`. Nothing else is copied.
faces=(
  iranyekanweblightfanum
  iranyekanwebregularfanum
  iranyekanwebmediumfanum
  iranyekanwebboldfanum
  iranyekanwebextraboldfanum
)

printf '%s\n' "${YELLOW}IRANYekan is proprietary software (fontiran.com).${RESET}"
printf '%s\n\n' "${DIM}Use it on this site only if the factory holds a licence for it.${RESET}"

tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

if [[ -f "$SOURCE" ]]; then
  cp "$SOURCE" "${tmp}/font.tgz"
else
  echo "Downloading ${SOURCE}"
  curl -fsSL "$SOURCE" -o "${tmp}/font.tgz"
fi

tar xzf "${tmp}/font.tgz" -C "$tmp"

mkdir -p "$target"

missing=0
for face in "${faces[@]}"; do
  src="$(find "$tmp" -name "${face}.woff" -print -quit)"
  if [[ -z "$src" ]]; then
    echo "  missing: ${face}.woff"
    missing=1
    continue
  fi
  cp "$src" "${target}/${face}.woff"
  echo "  ${face}.woff"
done

if (( missing )); then
  echo
  echo "Some faces were not in the archive. The site falls back to Vazirmatn for those weights."
  exit 1
fi

echo
printf '%s\n' "${BOLD}Done.${RESET} ${DIM}${target}${RESET}"
echo "Rebuild the front end for the change to reach the browser:"
echo "  cd ${root}/apps/web && npm run build"
