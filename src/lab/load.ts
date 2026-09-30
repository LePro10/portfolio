import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import {
  PREVIEW_STATUSES,
  SLUG_RE,
  parseCollection,
  parseRun,
  sitePath,
  type CollectionManifest,
  type RunManifest,
  type RunStatus,
} from "./schema.ts";

export interface LabRun extends RunManifest {
  slug: string;
  collection: string;
  /** Adresse des Artefakts, null ohne Vorschau. */
  href: string | null;
  files: number;
}

export interface LabCollection extends CollectionManifest {
  slug: string;
  prompt: string;
  runs: LabRun[];
}

export interface LabLoadResult {
  collections: LabCollection[];
  /** Jeder Eintrag: "<pfad>: <problem>". Leer = Lab ist konsistent. */
  errors: string[];
}

const STATUS_ORDER: Record<RunStatus, number> = { success: 0, template: 1, "server-only": 2, failed: 3 };
/** Dinge, die in einem ausgelieferten Artefakt nichts verloren haben. */
const FORBIDDEN_IN_DIST = new Set(["node_modules", ".git", ".env", ".next"]);

export function labRoot(cwd = process.cwd()): string {
  return join(cwd, "lab");
}

function readJson(file: string): unknown {
  return JSON.parse(readFileSync(file, "utf8"));
}

function walkDist(dir: string, rel: string, errors: string[]): number {
  let count = 0;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (FORBIDDEN_IN_DIST.has(entry.name)) {
      errors.push(`${rel}/${entry.name}: gehört nicht in ein Artefakt`);
      continue;
    }
    count += entry.isDirectory() ? walkDist(join(dir, entry.name), `${rel}/${entry.name}`, errors) : 1;
  }
  return count;
}

function loadRun(collection: string, runsDir: string, slug: string, errors: string[]): LabRun | null {
  const rel = `lab/${collection}/runs/${slug}`;
  const dir = join(runsDir, slug);
  if (!statSync(dir).isDirectory()) {
    errors.push(`${rel}: nur Ordner erlaubt`);
    return null;
  }
  if (!SLUG_RE.test(slug)) errors.push(`${rel}: Ordnername muss kleingeschrieben-mit-bindestrich sein`);

  for (const entry of readdirSync(dir)) {
    if (entry !== "run.json" && entry !== "dist") errors.push(`${rel}/${entry}: unerwartet (erlaubt: run.json, dist/)`);
  }

  const manifestFile = join(dir, "run.json");
  if (!existsSync(manifestFile)) {
    errors.push(`${rel}: run.json fehlt`);
    return null;
  }
  let raw: unknown;
  try {
    raw = readJson(manifestFile);
  } catch (e) {
    errors.push(`${rel}/run.json: kein gültiges JSON (${(e as Error).message})`);
    return null;
  }
  const parsed = parseRun(raw);
  if (!parsed.ok) {
    for (const err of parsed.errors) errors.push(`${rel}/run.json: ${err}`);
    return null;
  }

  const run = parsed.value;
  const distDir = join(dir, "dist");
  const hasDist = existsSync(distDir);
  const previewable = PREVIEW_STATUSES.includes(run.status);
  let files = 0;
  if (previewable) {
    if (!existsSync(join(distDir, "index.html"))) errors.push(`${rel}: Status "${run.status}" braucht dist/index.html`);
    else files = walkDist(distDir, `${rel}/dist`, errors);
  } else if (hasDist) {
    errors.push(`${rel}: Status "${run.status}" darf kein dist/ haben — Artefakt löschen oder Status korrigieren`);
  }

  return { ...run, slug, collection, href: previewable ? sitePath(collection, slug) : null, files };
}

function loadCollection(root: string, slug: string, errors: string[]): LabCollection | null {
  const rel = `lab/${slug}`;
  const dir = join(root, slug);
  if (!SLUG_RE.test(slug)) errors.push(`${rel}: Ordnername muss kleingeschrieben-mit-bindestrich sein`);

  for (const entry of readdirSync(dir)) {
    if (!["collection.json", "prompt.md", "runs"].includes(entry)) errors.push(`${rel}/${entry}: unerwartet (erlaubt: collection.json, prompt.md, runs/)`);
  }

  const manifestFile = join(dir, "collection.json");
  const promptFile = join(dir, "prompt.md");
  const runsDir = join(dir, "runs");
  if (!existsSync(manifestFile)) errors.push(`${rel}: collection.json fehlt`);
  if (!existsSync(promptFile)) errors.push(`${rel}: prompt.md fehlt`);
  if (!existsSync(runsDir)) errors.push(`${rel}: runs/ fehlt`);
  if (!existsSync(manifestFile) || !existsSync(promptFile) || !existsSync(runsDir)) return null;

  let raw: unknown;
  try {
    raw = readJson(manifestFile);
  } catch (e) {
    errors.push(`${rel}/collection.json: kein gültiges JSON (${(e as Error).message})`);
    return null;
  }
  const parsed = parseCollection(raw);
  if (!parsed.ok) {
    for (const err of parsed.errors) errors.push(`${rel}/collection.json: ${err}`);
    return null;
  }

  const runs: LabRun[] = [];
  const models = new Map<string, string>();
  for (const runSlug of readdirSync(runsDir).sort()) {
    const run = loadRun(slug, runsDir, runSlug, errors);
    if (!run) continue;
    const key = run.model.toLowerCase();
    const other = models.get(key);
    if (other) errors.push(`${rel}/runs/${runSlug}: Modell "${run.model}" gibt es schon in runs/${other}`);
    models.set(key, runSlug);
    runs.push(run);
  }
  runs.sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status] || a.model.localeCompare(b.model, "en", { sensitivity: "base" }));

  return { ...parsed.value, slug, prompt: readFileSync(promptFile, "utf8").trimEnd(), runs };
}

export function loadLab(root = labRoot()): LabLoadResult {
  const errors: string[] = [];
  const collections: LabCollection[] = [];
  if (!existsSync(root)) return { collections, errors: [`${root}: lab/ fehlt`] };

  for (const entry of readdirSync(root, { withFileTypes: true })) {
    if (!entry.isDirectory()) {
      if (entry.name !== "README.md") errors.push(`lab/${entry.name}: unerwartet (erlaubt: README.md und Sammlungsordner)`);
      continue;
    }
    const collection = loadCollection(root, entry.name, errors);
    if (collection) collections.push(collection);
  }
  collections.sort((a, b) => a.order - b.order);
  return { collections, errors };
}

export interface LabStats {
  runs: number;
  success: number;
  failed: number;
  previews: number;
  models: number;
  successRate: number;
}

export function labStats(collections: LabCollection[]): LabStats {
  const runs = collections.flatMap((c) => c.runs);
  const success = runs.filter((r) => r.status === "success").length;
  return {
    runs: runs.length,
    success,
    failed: runs.filter((r) => r.status === "failed").length,
    previews: runs.filter((r) => r.href).length,
    models: new Set(runs.map((r) => r.model.toLowerCase())).size,
    successRate: runs.length ? Math.round((success / runs.length) * 100) : 0,
  };
}
