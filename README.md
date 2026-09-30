# Portfolio — neuralhub.dev

Leandro Probsts Portfolio: Partikel-Startseite (Three.js), Services und ein
öffentliches AI Lab mit jedem Modelllauf, Fehlschläge eingeschlossen.

Next.js 16 als **statischer Export**, ausgeliefert von Caddy in einem eigenen
LXC. Das private Dashboard ist ein anderes Repo auf einem anderen Host.

```bash
pnpm install
pnpm dev          # http://localhost:3000
pnpm validate     # lint, typecheck, test, build
pnpm build && pnpm preview   # out/ mit den Produktionsregeln, http://localhost:4173
```

| Pfad | Inhalt |
|------|--------|
| `src/app/` | Seiten: `/`, `/lab`, `/services`, 404 |
| `src/content/` | alle Texte (Profil, Projekte, Services) — Text ändern, ohne Layout anzufassen |
| `src/components/` | `home/` Startseite, `scene/` WebGL-Berg und Erde, `lab/`, `site/` Navigation und Footer, `buttons/` |
| `src/lab/` | Schema, Laden und Pfad-Umschreibung des AI Labs |
| `lab/` | AI-Lab-Daten — **neue Tests: [lab/README.md](lab/README.md)** |
| `scripts/` | `lab.ts` (check/build/add), `preview.ts` |
| `deploy/` | Caddyfile, Setup, Update-Timer — [deploy/README.md](deploy/README.md) |

Deploy: Push auf `main`, der Container baut innerhalb von 2 Minuten selbst.
