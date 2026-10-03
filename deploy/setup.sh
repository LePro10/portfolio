#!/usr/bin/env bash
#
# Einmalige Einrichtung im Portfolio-LXC (Debian 12), als root. Idempotent:
# nach Änderungen an deploy/* einfach erneut ausführen.
#
#   curl -fsSL https://raw.githubusercontent.com/LePro10/portfolio/main/deploy/setup.sh | bash
#
# Installiert Node 22 (NodeSource), Caddy (offizielles Repo) und git, legt den
# Benutzer "portfolio" an, klont das Repo, richtet Caddy + systemd-Timer ein
# und baut das erste Release.
set -Eeuo pipefail

REPO_URL=${REPO_URL:-https://github.com/LePro10/portfolio.git}
BASE=/opt/portfolio

[[ $EUID -eq 0 ]] || { echo "Bitte als root ausführen." >&2; exit 1; }
# Das Debian-Template hat nur die C-Locale; ohne das warnen apt und perl bei jedem Schritt.
export LANG=C.UTF-8 LC_ALL=C.UTF-8

echo "── Pakete"
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get install -y -qq ca-certificates curl git gnupg debian-keyring debian-archive-keyring apt-transport-https >/dev/null

if ! command -v node >/dev/null || [[ $(node -p 'process.versions.node.split(".")[0]') -lt 22 ]]; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash - >/dev/null
  apt-get install -y -qq nodejs >/dev/null
fi

if ! command -v caddy >/dev/null; then
  curl -1sLf https://dl.cloudsmith.io/public/caddy/stable/gpg.key | gpg --dearmor --yes -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
  curl -1sLf https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt > /etc/apt/sources.list.d/caddy-stable.list
  apt-get update -qq
  apt-get install -y -qq caddy >/dev/null
fi
# pnpm als echter Befehl: package.json-Skripte rufen pnpm verschachtelt auf.
corepack enable pnpm
echo "node $(node -v), caddy $(caddy version | cut -d' ' -f1)"

echo "── Benutzer und Repo"
id portfolio >/dev/null 2>&1 || useradd --system --home-dir "$BASE" --shell /usr/sbin/nologin portfolio
install -d -o portfolio -g portfolio -m 755 "$BASE" "$BASE/releases"
if [[ ! -d $BASE/repo/.git ]]; then
  runuser -u portfolio -- git clone --quiet --no-checkout "$REPO_URL" "$BASE/repo"
fi
runuser -u portfolio -- git -C "$BASE/repo" fetch --quiet origin main
SRC=$(mktemp -d)
# Als Besitzer lesen: git verweigert root ein fremdes Repo ("dubious ownership").
runuser -u portfolio -- git -C "$BASE/repo" archive origin/main deploy | tar -x -C "$SRC"

echo "── Caddy und systemd"
install -m 755 "$SRC/deploy/update.sh" /usr/local/bin/portfolio-update
install -m 644 "$SRC/deploy/Caddyfile" /etc/caddy/Caddyfile
install -m 644 "$SRC/deploy/portfolio-update.service" "$SRC/deploy/portfolio-update.timer" /etc/systemd/system/
rm -rf "$SRC"
caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile >/dev/null
systemctl daemon-reload
systemctl enable --now caddy >/dev/null
# restart statt reload: "admin off" im Caddyfile schaltet die API ab, die reload braucht.
systemctl restart caddy

echo "── Erstes Release (dauert ein paar Minuten)"
systemctl start portfolio-update.service
systemctl enable --now portfolio-update.timer >/dev/null

curl -fsS -o /dev/null http://127.0.0.1/ && curl -fsS -o /dev/null http://127.0.0.1/lab \
  && echo "✓ Portfolio läuft auf http://$(hostname -I | awk '{print $1}')/" \
  || { echo "✗ Seite antwortet nicht — journalctl -u portfolio-update -u caddy" >&2; exit 1; }
