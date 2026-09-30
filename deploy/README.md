# Betrieb

Das Portfolio ist ein rein statischer Export (`out/`). Im Betrieb läuft kein
Node-Prozess: Caddy liefert Dateien aus, ein systemd-Timer baut neue Commits.

```text
Browser
  └─ Sunrise-Box (80/443) → Edge 192.168.30.56 (OpenResty, TLS)
       ├─ neuralhub.dev, www.neuralhub.dev → Portfolio-LXC :80 (dieses Repo)
       └─ dashboard.neuralhub.dev          → oc 192.168.30.91:80 (Repo neuralhub)
```

## Deploy

Push auf `main` → spätestens 2 Minuten später holt der Container den Stand,
baut ihn und schaltet ihn atomar live. Kein Runner, kein offener Port, keine
Zugangsdaten bei GitHub. Schlägt der Build oder die Prüfung fehl, bleibt die
laufende Version stehen.

```bash
journalctl -u portfolio-update -n 50        # was zuletzt passiert ist
systemctl start portfolio-update            # sofort prüfen statt auf den Timer warten
sudo -u portfolio portfolio-update --force  # aktuellen Stand neu bauen
sudo -u portfolio portfolio-update --rollback
ls -l /opt/portfolio/current                # aktives Release (= Commit-SHA)
```

Die letzten drei Releases liegen unter `/opt/portfolio/releases/<sha>/`.

## Container anlegen (Proxmox, einmalig)

Auf dem Proxmox-Node. IP, Gateway, ID und Storage anpassen; die IP vorher auf
Belegung prüfen (`ping`).

```bash
pveam update
pveam download local debian-12-standard_12.12-1_amd64.tar.zst   # aktuelle Version: pveam available | grep debian-12

pct create 130 local:vztmpl/debian-12-standard_12.12-1_amd64.tar.zst \
  --hostname portfolio \
  --cores 2 --memory 2048 --swap 1024 \
  --rootfs local-lvm:12 \
  --net0 name=eth0,bridge=vmbr0,ip=192.168.30.X/24,gw=192.168.30.1 \
  --unprivileged 1 --features nesting=1 \
  --onboot 1 --start 1

pct exec 130 -- bash -c "apt-get update -qq && apt-get install -y -qq curl && \
  curl -fsSL https://raw.githubusercontent.com/LePro10/portfolio/main/deploy/setup.sh | bash"
```

`setup.sh` ist idempotent. Nach Änderungen an `deploy/*` (Caddyfile, Units,
`update.sh`) einfach erneut ausführen — der Timer aktualisiert nur die Seite,
nicht die Betriebsdateien.

## Umschalten der Domain

Auf der Edge (`192.168.30.56`) den Upstream für `neuralhub.dev` und
`www.neuralhub.dev` von `http://192.168.30.91:80` auf `http://<portfolio-ip>:80`
ändern. `dashboard.neuralhub.dev` bleibt unverändert. Zurück geht es mit
derselben Zeile.

Vorher im LAN prüfen: `curl -H 'Host: neuralhub.dev' http://<portfolio-ip>/lab`.

## Was Caddy zusätzlich macht

- Alte Adressen: `/dashboard/*` → 308 auf `dashboard.neuralhub.dev`,
  `/test-sites/<sammlung>-<lauf>/` → `/sites/<sammlung>/<lauf>/`,
  `/ai-test-results` → `/lab`, `/leistungen` → `/services`,
  `/about`, `/projects`, `/contact` → Abschnitte der Startseite.
- `/sites/*` (AI-Lab-Artefakte) mit CSP-Sandbox: eigene undurchsichtige Origin,
  kein Zugriff auf Portfolio-DOM oder -Storage.
- `/health` → `ok`.

`pnpm preview` bildet dieselben Regeln lokal nach (`scripts/preview.ts`).
