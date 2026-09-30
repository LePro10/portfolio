import { describe, expect, it } from "vitest";
import { parseCollection, parseRun, sitePath, slugify } from "./schema";

describe("slugify", () => {
  it("matches the ids of the old /test-sites/ urls", () => {
    expect(slugify("gemini-3.5-flash(high)")).toBe("gemini-3-5-flash-high");
    expect(slugify("mimo-v2.5 pro")).toBe("mimo-v2-5-pro");
    expect(slugify("Qwen3.6-Plus")).toBe("qwen3-6-plus");
  });
});

describe("parseRun", () => {
  it("accepts a complete run", () => {
    const r = parseRun({ model: "GPT 5.7", status: "success", stack: "react-vite", date: "2026-09-30", featured: "Aether" });
    expect(r.ok).toBe(true);
  });

  it("rejects unknown fields so the schema cannot drift", () => {
    const r = parseRun({ model: "x", status: "success", stack: "unknown", origin: "old" });
    expect(r).toEqual({ ok: false, errors: ['unbekanntes Feld "origin"'] });
  });

  it("rejects invalid status, stack and date", () => {
    const r = parseRun({ model: "x", status: "ok", stack: "vue", date: "30.09.2026" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors).toHaveLength(3);
  });

  it("does not allow featuring a failed run", () => {
    expect(parseRun({ model: "x", status: "failed", stack: "unknown", featured: "Nope" }).ok).toBe(false);
  });
});

describe("parseCollection", () => {
  it("needs title, description and an integer order", () => {
    expect(parseCollection({ title: "A", description: "B", order: 1 }).ok).toBe(true);
    expect(parseCollection({ title: "A", description: "", order: 1.5 }).ok).toBe(false);
  });
});

it("builds the public artifact path", () => {
  expect(sitePath("websites", "opus5")).toBe("/sites/websites/opus5/");
});
