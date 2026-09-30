#!/usr/bin/env bash
#
# Legt den Portfolio-Container auf Leandros Proxmox (192.168.30.150, Node "server")
# an und richtet ihn mit deploy/setup.sh ein. Auf dem Proxmox-Host als root:
#
#   curl -fsSL https://raw.githubusercontent.com/LePro10/portfolio/main/deploy/proxmox-create.sh | bash
#
# Anpassbar per Umgebung: CTID=120 IP=192.168.30.64 GW=192.168.30.1 STORAGE=local-lvm BRIDGE=vmbr0
set -Eeuo pipefail

CTID=${CTID:-120}
IP=${IP:-192.168.30.64}
GW=${GW:-192.168.30.1}
STORAGE=${STORAGE:-local-lvm}
BRIDGE=${BRIDGE:-vmbr0}
TEMPLATE=debian-12-standard_12.12-1_amd64.tar.zst

command -v pct >/dev/null || { echo "✗ Kein Proxmox-Host (pct fehlt)." >&2; exit 1; }
if pct status "$CTID" >/dev/null 2>&1; then echo "✗ CT $CTID gibt es schon — CTID=<andere> setzen." >&2; exit 1; fi
if ping -c1 -W1 "$IP" >/dev/null 2>&1; then echo "✗ $IP antwortet schon — IP=<andere> setzen." >&2; exit 1; fi
pvesm status | awk '{print $1}' | grep -qx "$STORAGE" || { echo "✗ Speicher $STORAGE fehlt — STORAGE=<name> setzen." >&2; exit 1; }

echo "── Template"
pveam list local | grep -q "$TEMPLATE" || { pveam update >/dev/null; pveam download local "$TEMPLATE"; }

echo "── Container $CTID ($IP) auf $(hostname)"
pct create "$CTID" "local:vztmpl/$TEMPLATE" \
  --hostname portfolio --cores 2 --memory 2048 --swap 1024 \
  --rootfs "$STORAGE:12" \
  --net0 "name=eth0,bridge=$BRIDGE,gw=$GW,ip=$IP/24" \
  --nameserver "$GW" \
  --unprivileged 1 --features nesting=1 --onboot 1 --start 1 \
  --description "Portfolio neuralhub.dev — github.com/LePro10/portfolio"

for _ in $(seq 1 20); do pct exec "$CTID" -- getent hosts github.com >/dev/null 2>&1 && break; sleep 2; done
if ! pct exec "$CTID" -- getent hosts github.com >/dev/null 2>&1; then
  echo "DNS über $GW geht nicht — nehme 1.1.1.1"
  pct set "$CTID" --nameserver 1.1.1.1
  pct exec "$CTID" -- bash -c 'echo "nameserver 1.1.1.1" > /etc/resolv.conf'
fi

echo "── Einrichten (ein paar Minuten)"
pct exec "$CTID" -- bash -c "apt-get update -qq && apt-get install -y -qq curl >/dev/null && curl -fsSL https://raw.githubusercontent.com/LePro10/portfolio/main/deploy/setup.sh | bash"
