/**
 * AI-Lab-Werkzeug. Läuft direkt mit Node (Type Stripping), ohne Build.
 *
 *   pnpm lab:check                         Lab gegen src/lab/schema.ts prüfen
 *   pnpm lab:build                         Artefakte nach public/sites/ kopieren und Pfade umschreiben
 *   pnpm lab:add <sammlung> --model "…" --status success --stack react-vite --from <ordner>
 *
 * Details und Beispiele: lab/README.md
 */
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { extname, join, relative, resolve, sep } from "node:path";
import { parseArgs } from "node:util";
import { labRoot, loadLab, type LabRun } from "../src/lab/load.ts";
import { REWRITE_EXTENSIONS, rewriteFile } from "../src/lab/rewrite.ts";
import { PREVIEW_STATUSES, RUN_STACKS, RUN_STATUSES, parseRun, slugify, type RunManifest } from "../src/lab/schema.ts";

const ROOT = process.cwd();
const SITES = join(ROOT, "public", "sites");
const STAMPS = join(ROOT, "node_modules", ".cache", "lab-stamps.json");
/** Erhöhen, wenn sich src/lab/rewrite.ts ändert — erzwingt Neuaufbau aller Artefakte. */
const REWRITE_VERSION = 4;

function fail(message: string): never {
  console.error(`✗ ${message}`);
  process.exit(1);
}

function check(): ReturnType<typeof loadLab> {
  const result = loadLab();
  if (result.errors.length) {
    console.error(`✗ Lab hat ${result.errors.length} Problem(e):`);
    for (const e of result.errors) console.error(`  - ${e}`);
    process.exit(1);
  }
  const runs = result.collections.flatMap((c) => c.runs);
  console.log(`✓ Lab ok — ${result.collections.length} Sammlungen, ${runs.length} Läufe, ${runs.filter((r) => r.href).length} mit Vorschau`);
  return result;
}

function listFiles(dir: string, base = dir): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? listFiles(join(dir, e.name), base) : [relative(base, join(dir, e.name))],
  );
}

function fingerprint(dir: string): string {
  const hash = createHash("sha1").update(String(REWRITE_VERSION));
  for (const file of listFiles(dir).sort()) {
    const s = statSync(join(dir, file));
    hash.update(`${file}:${s.size}:${s.mtimeMs}\n`);
  }
  return hash.digest("hex");
}

function publish(run: LabRun, source: string, target: string) {
  rmSync(target, { recursive: true, force: true });
  mkdirSync(target, { recursive: true });
  cpSync(source, target, { recursive: true });
  const files = listFiles(target);
  const known = new Set(files.map((f) => f.split(sep).join("/")));
  for (const file of files) {
    const ext = extname(file).toLowerCase();
    if (!REWRITE_EXTENSIONS.has(ext)) continue;
    const full = join(target, file);
    const before = readFileSync(full, "utf8");
    const after = rewriteFile(before, ext, run.href!, known);
    if (after !== before) writeFileSync(full, after);
  }
}

function build() {
  const { collections } = check();
  const stamps: Record<string, string> = existsSync(STAMPS) ? JSON.parse(readFileSync(STAMPS, "utf8")) : {};
  const wanted = new Set<string>();
  let built = 0;

  for (const run of collections.flatMap((c) => c.runs)) {
    if (!run.href) continue;
    const key = `${run.collection}/${run.slug}`;
    wanted.add(key);
    const source = join(labRoot(), run.collection, "runs", run.slug, "dist");
    const target = join(SITES, run.collection, run.slug);
    const print = fingerprint(source);
    if (stamps[key] === print && existsSync(join(target, "index.html"))) continue;
    publish(run, source, target);
    stamps[key] = print;
    built++;
  }

  // Verwaiste Ausgaben entfernen (Lauf gelöscht oder umbenannt).
  if (existsSync(SITES)) {
    for (const collection of readdirSync(SITES)) {
      for (const run of readdirSync(join(SITES, collection))) {
        const key = `${collection}/${run}`;
        if (!wanted.has(key)) {
          rmSync(join(SITES, collection, run), { recursive: true, force: true });
          delete stamps[key];
        }
      }
    }
  }

  mkdirSync(join(STAMPS, ".."), { recursive: true });
  writeFileSync(STAMPS, JSON.stringify(stamps));
  console.log(`✓ public/sites — ${built} neu gebaut, ${wanted.size - built} unverändert`);
}

function findDist(from: string): string {
  const dir = resolve(from);
  if (existsSync(join(dir, "index.html"))) return dir;
  for (const sub of ["dist", "out", "build"]) {
    if (existsSync(join(dir, sub, "index.html"))) return join(dir, sub);
  }
  fail(`${from}: keine index.html gefunden (auch nicht in dist/, out/, build/). Erst statisch bauen.`);
}

function add(argv: string[]) {
  const { values, positionals } = parseArgs({
    args: argv,
    allowPositionals: true,
    options: {
      model: { type: "string" },
      status: { type: "string" },
      stack: { type: "string" },
      from: { type: "string" },
      date: { type: "string" },
      note: { type: "string" },
      featured: { type: "string" },
      slug: { type: "string" },
      replace: { type: "boolean", default: false },
    },
  });
  const collection = positionals[0];
  if (!collection) fail(`Sammlung fehlt. Beispiel: pnpm lab:add websites --model "GPT 5.7" --status success --stack react-vite --from ../gpt57/dist`);
  const collectionDir = join(labRoot(), collection);
  if (!existsSync(join(collectionDir, "collection.json"))) {
    const known = readdirSync(labRoot(), { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name);
    fail(`Sammlung "${collection}" gibt es nicht. Vorhanden: ${known.join(", ")}`);
  }
  if (!values.model) fail("--model fehlt");

  const manifest: RunManifest = {
    model: values.model,
    status: (values.status ?? "success") as RunManifest["status"],
    stack: (values.stack ?? "unknown") as RunManifest["stack"],
    date: values.date ?? new Date().toISOString().slice(0, 10),
    ...(values.note ? { note: values.note } : {}),
    ...(values.featured ? { featured: values.featured } : {}),
  };
  const parsed = parseRun(manifest);
  if (!parsed.ok) fail(`${parsed.errors.join("; ")}\n  status: ${RUN_STATUSES.join(" | ")}\n  stack:  ${RUN_STACKS.join(" | ")}`);

  const previewable = PREVIEW_STATUSES.includes(manifest.status);
  if (previewable && !values.from) fail(`Status "${manifest.status}" braucht --from <ordner mit index.html>`);
  if (!previewable && values.from) fail(`Status "${manifest.status}" hat kein Artefakt — --from weglassen`);

  const slug = values.slug ?? slugify(values.model);
  const runDir = join(collectionDir, "runs", slug);
  if (existsSync(runDir)) {
    if (!values.replace) fail(`lab/${collection}/runs/${slug} gibt es schon. --replace überschreibt, --slug wählt einen anderen Ordner.`);
    rmSync(runDir, { recursive: true, force: true });
  }

  mkdirSync(runDir, { recursive: true });
  writeFileSync(join(runDir, "run.json"), `${JSON.stringify(manifest, null, 2)}\n`);
  if (values.from) cpSync(findDist(values.from), join(runDir, "dist"), { recursive: true });
  console.log(`✓ lab/${collection}/runs/${slug} angelegt`);
  check();
}

const [command, ...rest] = process.argv.slice(2);
switch (command) {
  case "check":
    check();
    break;
  case "build":
    build();
    break;
  case "add":
    add(rest);
    break;
  default:
    fail(`Unbekannter Befehl "${command ?? ""}". Erlaubt: check, build, add`);
}
