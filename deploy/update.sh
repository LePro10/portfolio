#!/usr/bin/env bash
#
# Holt main, baut ein neues Release und schaltet es atomar live.
# Läuft als Benutzer "portfolio" per systemd-Timer (portfolio-update.timer).
#
#   deploy/update.sh              nur wenn origin/main neuer ist als das aktive Release
#   deploy/update.sh --force      aktuellen Stand neu bauen
#   deploy/update.sh --rollback   zurück auf das vorige Release
#
# Ablauf: git fetch → Export nach releases/<sha> → pnpm install + build (inkl.
# lab:check) → Prüfung von out/ → Symlink current umhängen → alte Releases weg.
# Schlägt irgendein Schritt fehl, bleibt current unberührt.
set -Eeuo pipefail

BASE=/opt/portfolio
REPO=$BASE/repo
RELEASES=$BASE/releases
CURRENT=$BASE/current
KEEP=3
LOCK=/run/lock/portfolio-update.lock

log() { printf '%s %s\n' "$(date -Is)" "$*"; }

exec 9>"$LOCK"
flock -n 9 || { log "läuft schon — übersprungen"; exit 0; }

active_sha() { [[ -L $CURRENT ]] && basename "$(dirname "$(readlink -f "$CURRENT")")" || true; }

switch_to() {
  local target=$1
  ln -sfn "$target" "$CURRENT.next"
  mv -Tf "$CURRENT.next" "$CURRENT"
}

if [[ ${1:-} == --rollback ]]; then
  active=$(active_sha)
  previous=$(ls -1t "$RELEASES" | grep -vx "$active" | head -n1 || true)
  [[ -n $previous && -d $RELEASES/$previous/out ]] || { log "kein früheres Release vorhanden"; exit 1; }
  switch_to "$RELEASES/$previous/out"
  log "Rollback: $active → $previous"
  exit 0
fi

git -C "$REPO" fetch --quiet origin main
sha=$(git -C "$REPO" rev-parse --short=12 origin/main)
if [[ $sha == "$(active_sha)" && ${1:-} != --force ]]; then
  exit 0
fi

log "baue $sha"
dir=$RELEASES/$sha
rm -rf "$dir"
mkdir -p "$dir"
git -C "$REPO" archive origin/main | tar -x -C "$dir"

cd "$dir"
corepack pnpm install --frozen-lockfile --prefer-offline >/dev/null
NEXT_TELEMETRY_DISABLED=1 corepack pnpm build

# Mindestens das muss im Export liegen, sonst wird nicht umgeschaltet.
for f in index.html lab.html services.html 404.html land.geojson; do
  [[ -s out/$f ]] || { log "FEHLER: out/$f fehlt — Release $sha verworfen"; exit 1; }
done
sites=$(find out/sites -mindepth 2 -maxdepth 2 -type d | wc -l)
(( sites > 0 )) || { log "FEHLER: keine AI-Lab-Artefakte in out/sites — Release $sha verworfen"; exit 1; }

# node_modules wird im Betrieb nicht gebraucht; spart pro Release einige hundert MB.
rm -rf node_modules .next public/sites

previous=$(active_sha)
switch_to "$dir/out"
log "live: $sha (vorher: ${previous:-keins}, $sites Lab-Seiten)"

ls -1t "$RELEASES" | tail -n +$((KEEP + 1)) | while read -r old; do
  [[ $old == "$sha" ]] || rm -rf "${RELEASES:?}/$old"
done
