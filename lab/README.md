# AI Lab

Jeder Ordner hier ist eine **Sammlung**: ein Prompt, viele Modelle. Jeder
Unterordner in `runs/` ist ein **Lauf**: ein Modell, ein Ergebnis. Die Regeln
stehen als Code in `src/lab/schema.ts` und werden bei jedem Build geprüft —
ein Lab, das nicht passt, geht nicht live.

```text
lab/
  <sammlung>/                 z. B. websites
    collection.json           { "title", "description", "order" }
    prompt.md                 der Prompt, den jedes Modell bekam, wörtlich
    runs/
      <lauf>/                 kleingeschrieben-mit-bindestrich, z. B. gpt-5-7
        run.json              siehe unten
        dist/                 statischer Build, nur bei success/template
```

## Einen neuen Lauf hinzufügen

1. Das Ergebnis des Modells **statisch bauen** (`vite build`, `next build` mit
   `output: "export"`, oder fertiges HTML). Der Build ist für die Wurzel einer
   Domain gedacht (`base: "/"`); die Pfade schreibt `pnpm lab:build` selbst um.
2. Anlegen:

   ```bash
   pnpm lab:add websites --model "GPT 5.7" --status success --stack react-vite --from ../gpt57-site/dist
   pnpm lab:add websites --model "Tiny 3B" --status failed --stack unknown --note "Stopped after the plan."
   ```

   Das legt `runs/<lauf>/run.json` an, kopiert den Build nach `dist/` und prüft
   danach das ganze Lab.
3. `pnpm dev` → `/lab` ansehen und den Lauf öffnen.
4. Committen: `git add lab/websites/runs/gpt-5-7 && git commit -m "lab: GPT 5.7 (websites)"`.

Von Hand anlegen geht genauso; `pnpm lab:check` sagt, was fehlt.

## run.json

| Feld       | Pflicht | Werte |
|------------|---------|-------|
| `model`    | ja      | Anzeigename, z. B. `"GPT 5.7"` |
| `status`   | ja      | `success` · `template` (Standard-Template statt Seite) · `server-only` (läuft nur mit Server) · `failed` |
| `stack`    | ja      | `react-vite` · `next-static` · `next-server` · `vanilla-html` · `unknown` |
| `date`     | nein    | `YYYY-MM-DD`, Tag der Generierung |
| `note`     | nein    | ein Satz: Grund des Fehlschlags oder Besonderheit (öffentlich sichtbar) |
| `featured` | nein    | Seitentitel → erscheint als Live-Vorschau oben im Lab |

Andere Felder sind nicht erlaubt — so wächst das Format nicht still auseinander.

## Regeln, die der Check erzwingt

- `success` und `template` brauchen `dist/index.html`; `failed` und
  `server-only` haben **kein** `dist/`.
- Im Lauf-Ordner liegen nur `run.json` und `dist/` — kein Quellcode, kein
  `node_modules`, keine Notizen. In `dist/` sind `node_modules`, `.git`, `.next`
  und `.env` verboten.
- Ordnernamen sind kleingeschrieben-mit-bindestrich; ein Modell kommt pro
  Sammlung nur einmal vor. Ein zweiter Versuch desselben Modells bekommt einen
  eigenen Namen (`--model "GPT 5.7 (retry)"`).

## Eine neue Sammlung (neuer Prompt)

```bash
mkdir -p lab/<name>/runs
```

Dazu `collection.json` (`order` bestimmt die Reihenfolge auf `/lab`) und
`prompt.md` mit dem Prompt im Wortlaut. Dann Läufe wie oben hinzufügen.

## Was mit den Dateien passiert

`dist/` bleibt, wie das Modell es gebaut hat. `pnpm lab:build` kopiert jeden
Lauf nach `public/sites/<sammlung>/<lauf>/` (nicht versioniert) und schreibt
dort absolute Pfade auf diesen Präfix um. Öffentlich erreichbar ist er unter
`/sites/<sammlung>/<lauf>/`, in einer Sandbox ohne Zugriff aufs Portfolio.
