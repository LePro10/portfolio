/**
 * Datenmodell des AI Labs. Eine Stelle für alle Regeln: das Build-Skript
 * (scripts/lab.ts), die Seiten und die Tests prüfen gegen genau diese Datei.
 *
 *   lab/<sammlung>/collection.json   Titel, Beschreibung, Reihenfolge
 *   lab/<sammlung>/prompt.md          der Prompt, den jedes Modell bekam
 *   lab/<sammlung>/runs/<lauf>/run.json
 *   lab/<sammlung>/runs/<lauf>/dist/  statisches Artefakt, unverändert (optional)
 */

export const RUN_STATUSES = ["success", "template", "failed", "server-only"] as const;
export type RunStatus = (typeof RUN_STATUSES)[number];

export const RUN_STACKS = ["react-vite", "next-static", "next-server", "vanilla-html", "unknown"] as const;
export type RunStack = (typeof RUN_STACKS)[number];

/** Nur diese Status haben ein öffnenbares Artefakt. */
export const PREVIEW_STATUSES: readonly RunStatus[] = ["success", "template"];

export interface CollectionManifest {
  title: string;
  description: string;
  /** Kleinere Zahl steht weiter oben. */
  order: number;
}

export interface RunManifest {
  /** Modellname so, wie er angezeigt wird, z. B. "GPT 5.6 Terra". */
  model: string;
  status: RunStatus;
  stack: RunStack;
  /** Tag der Generierung, YYYY-MM-DD. Fehlt bei alten Läufen. */
  date?: string;
  /** Kurzer Satz: Grund eines Fehlschlags oder Besonderheit. */
  note?: string;
  /** Gesetzt = erscheint als Live-Vorschau oben im Lab. Wert ist der Seitentitel. */
  featured?: string;
}

export const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** "gemini-3.5-flash(high)" → "gemini-3-5-flash-high". Gleiche Regel wie die alten /test-sites/-IDs. */
export function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

type Check<T> = { ok: true; value: T } | { ok: false; errors: string[] };

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function unknownKeys(obj: Record<string, unknown>, allowed: readonly string[]): string[] {
  return Object.keys(obj).filter((k) => !allowed.includes(k)).map((k) => `unbekanntes Feld "${k}"`);
}

function nonEmptyString(obj: Record<string, unknown>, key: string, errors: string[], optional = false) {
  const v = obj[key];
  if (v === undefined && optional) return;
  if (typeof v !== "string" || v.trim() === "") errors.push(`"${key}" muss ein nicht-leerer Text sein`);
}

export function parseCollection(raw: unknown): Check<CollectionManifest> {
  if (!isRecord(raw)) return { ok: false, errors: ["collection.json muss ein Objekt sein"] };
  const errors = unknownKeys(raw, ["title", "description", "order"]);
  nonEmptyString(raw, "title", errors);
  nonEmptyString(raw, "description", errors);
  if (typeof raw.order !== "number" || !Number.isInteger(raw.order)) errors.push(`"order" muss eine ganze Zahl sein`);
  return errors.length ? { ok: false, errors } : { ok: true, value: raw as unknown as CollectionManifest };
}

export function parseRun(raw: unknown): Check<RunManifest> {
  if (!isRecord(raw)) return { ok: false, errors: ["run.json muss ein Objekt sein"] };
  const errors = unknownKeys(raw, ["model", "status", "stack", "date", "note", "featured"]);
  nonEmptyString(raw, "model", errors);
  if (!RUN_STATUSES.includes(raw.status as RunStatus)) errors.push(`"status" muss eines von ${RUN_STATUSES.join(", ")} sein`);
  if (!RUN_STACKS.includes(raw.stack as RunStack)) errors.push(`"stack" muss eines von ${RUN_STACKS.join(", ")} sein`);
  if (raw.date !== undefined && (typeof raw.date !== "string" || !DATE_RE.test(raw.date))) errors.push(`"date" muss YYYY-MM-DD sein`);
  nonEmptyString(raw, "note", errors, true);
  nonEmptyString(raw, "featured", errors, true);
  if (raw.status === "failed" && raw.featured !== undefined) errors.push("ein fehlgeschlagener Lauf kann nicht featured sein");
  return errors.length ? { ok: false, errors } : { ok: true, value: raw as unknown as RunManifest };
}

/** Öffentliche Adresse eines Artefakts. Muss zu deploy/Caddyfile passen. */
export function sitePath(collection: string, run: string): string {
  return `/sites/${collection}/${run}/`;
}
