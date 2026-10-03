# AGENTS.md — Portfolio

**Bau das so, als wäre es dein eigenes Produkt.** Leandro beschreibt Absichten
knapp; mitdenken, Lücken schliessen, nur fragen, wenn zwei Wege zu relevant
verschiedenen Ergebnissen führen.

## Was das ist

Öffentliches Portfolio auf `neuralhub.dev`. Statischer Next.js-Export, Caddy im
eigenen LXC. Das Dashboard (NeuralHub, Luna) ist ein **anderes Repo** und ein
anderer Host — hier nur verlinkt (`site.dashboard` in `src/content/profile.ts`).
Keine Weiterleitung aufs Dashboard: `dashboard.neuralhub.dev` routet die Edge direkt.

## Regeln

- Kein Server-Code: kein API-Route, keine Middleware, kein `next/headers`.
  Alles muss mit `output: "export"` bauen. Weiterleitungen gehören in
  `deploy/Caddyfile` und zusätzlich in `scripts/preview.ts`.
- Keine unbelegten Claims: keine erfundenen Zahlen, Preise, Referenzen oder Testimonials. Lab-Zahlen werden berechnet; feste Zahlen in `src/content/profile.ts` (Alter, Repos, Sprachen) aktuell halten.
- Texte stehen in `src/content/`, nicht im Markup. UI-Sprache Englisch; Code-Kommentare und Doku Deutsch.
- Design-Tokens aus `src/app/globals.css` (`--pf-*`, `--font-sans`, `--font-mono`) statt neuer Farben.
  Lichtfarben sind RGB-Tripel `--pf-t-*` (`rgb(var(--pf-t-mint) / .5)`); Bewegung je Bereich in `src/app/motion-*.css`.
- Bewegung: Startzustände nur unter `html.pf-motion` verstecken (fehlt bei reduzierter Bewegung).
  Scroll-Einblenden über `data-reveal` → `data-in` (`components/site/Reveal.tsx`). Zustand nie per
  `classList` auf React-Elemente schreiben — React setzt `className` neu, das Element verschwindet.
- AI-Lab-Daten nur nach `lab/README.md`. `pnpm lab:check` muss grün sein;
  Artefakte in `lab/**/dist` nicht von Hand „verschönern“.
- `src/lab/rewrite.ts` geändert → `REWRITE_VERSION` in `scripts/lab.ts` erhöhen
  und die Vorschauen im Browser prüfen (`pnpm build && pnpm preview`).
- Keine neuen Dependencies ohne Grund. pnpm.
- Keine Erfolgsmeldung ohne Prüfung. Visuelle Änderungen lokal ansehen,
  Desktop und ~390 px breit.

## Prüfen und liefern

```bash
pnpm validate      # lint, typecheck, test, lab:check, build
```

Agents committen, **pushen nicht**. Ein Push auf `main` ist ein Deploy
(Container holt ihn binnen 2 Minuten). Betrieb: `deploy/README.md`.

Infrastruktur: Leandros Proxmox ist `192.168.30.150` (Node `server`, Portfolio = CT 120,
`192.168.30.64`). `192.168.30.50` samt Edge `.56` gehört nicht Leandro — dort nichts ändern.

Dauerhafte Arbeitsregeln, die Leandro nebenbei sagt, gehören noch in derselben
Session in diese Datei — kurz, im Imperativ.
