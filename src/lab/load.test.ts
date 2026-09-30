import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { labStats, loadLab } from "./load";

let root: string;

function write(path: string, content: string | object) {
  const full = join(root, path);
  mkdirSync(join(full, ".."), { recursive: true });
  writeFileSync(full, typeof content === "string" ? content : JSON.stringify(content));
}

function collection(slug = "websites") {
  write(`${slug}/collection.json`, { title: "Websites", description: "Loose prompt.", order: 1 });
  write(`${slug}/prompt.md`, "surprise me\n");
}

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "lab-"));
});
afterEach(() => rmSync(root, { recursive: true, force: true }));

describe("loadLab", () => {
  it("loads a consistent lab and sorts successes first", () => {
    collection();
    write("websites/runs/zeta/run.json", { model: "Zeta", status: "success", stack: "vanilla-html" });
    write("websites/runs/zeta/dist/index.html", "<h1>hi</h1>");
    write("websites/runs/alpha/run.json", { model: "Alpha", status: "failed", stack: "unknown", note: "No build." });

    const { collections, errors } = loadLab(root);
    expect(errors).toEqual([]);
    expect(collections[0].prompt).toBe("surprise me");
    expect(collections[0].runs.map((r) => r.slug)).toEqual(["zeta", "alpha"]);
    expect(collections[0].runs[0]).toMatchObject({ href: "/sites/websites/zeta/", files: 1 });
    expect(collections[0].runs[1].href).toBeNull();
    expect(labStats(collections)).toMatchObject({ runs: 2, success: 1, failed: 1, previews: 1, successRate: 50 });
  });

  it("requires an artifact for success and forbids one for failed", () => {
    collection();
    write("websites/runs/a/run.json", { model: "A", status: "success", stack: "react-vite" });
    write("websites/runs/b/run.json", { model: "B", status: "failed", stack: "react-vite" });
    write("websites/runs/b/dist/index.html", "x");
    const { errors } = loadLab(root);
    expect(errors).toEqual([
      'lab/websites/runs/a: Status "success" braucht dist/index.html',
      'lab/websites/runs/b: Status "failed" darf kein dist/ haben — Artefakt löschen oder Status korrigieren',
    ]);
  });

  it("flags stray files, bad folder names, duplicates and build leftovers", () => {
    collection();
    write("notes.txt", "x");
    write("websites/runs/Bad_Name/run.json", { model: "A", status: "failed", stack: "unknown" });
    write("websites/runs/a-copy/run.json", { model: "a", status: "failed", stack: "unknown" });
    write("websites/runs/ok/run.json", { model: "OK", status: "success", stack: "react-vite" });
    write("websites/runs/ok/dist/index.html", "x");
    write("websites/runs/ok/dist/node_modules/x.js", "x");
    write("websites/runs/ok/src/main.ts", "x");
    const { errors } = loadLab(root);
    expect(errors).toContain("lab/notes.txt: unerwartet (erlaubt: README.md und Sammlungsordner)");
    expect(errors).toContain("lab/websites/runs/Bad_Name: Ordnername muss kleingeschrieben-mit-bindestrich sein");
    expect(errors.some((e) => e.includes('Modell "a" gibt es schon'))).toBe(true);
    expect(errors).toContain("lab/websites/runs/ok/dist/node_modules: gehört nicht in ein Artefakt");
    expect(errors).toContain("lab/websites/runs/ok/src: unerwartet (erlaubt: run.json, dist/)");
  });

  it("reports missing collection files instead of crashing", () => {
    mkdirSync(join(root, "empty"));
    const { collections, errors } = loadLab(root);
    expect(collections).toEqual([]);
    expect(errors).toEqual(["lab/empty: collection.json fehlt", "lab/empty: prompt.md fehlt", "lab/empty: runs/ fehlt"]);
  });

  it("reports broken JSON with its path", () => {
    collection();
    write("websites/runs/a/run.json", "{ nope");
    expect(loadLab(root).errors[0]).toMatch(/^lab\/websites\/runs\/a\/run\.json: kein gültiges JSON/);
  });
});
