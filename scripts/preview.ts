/**
 * Lokale Vorschau von out/ mit denselben Regeln wie deploy/Caddyfile:
 * saubere URLs (/lab → lab.html), SPA-Fallback und CSP-Sandbox für /sites/*.
 * Nur für den eigenen Rechner — in Produktion liefert Caddy aus.
 *
 *   pnpm build && pnpm preview        → http://localhost:4173
 */
import { createServer } from "node:http";
import { existsSync, readFileSync, statSync } from "node:fs";
import { extname, join, normalize, sep } from "node:path";

const OUT = join(process.cwd(), "out");
const PORT = Number(process.env.PORT ?? 4173);
const SITE_RE = /^\/sites\/([a-z0-9-]+)\/([a-z0-9-]+)(?:\/|$)/;
const SANDBOX = "sandbox allow-scripts allow-forms allow-popups allow-modals";

const TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".mjs": "text/javascript",
  ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
  ".gif": "image/gif", ".webp": "image/webp", ".ico": "image/x-icon", ".woff": "font/woff", ".woff2": "font/woff2",
  ".ttf": "font/ttf", ".txt": "text/plain; charset=utf-8", ".xml": "application/xml", ".mp4": "video/mp4", ".geojson": "application/geo+json",
};

function file(path: string): string | null {
  const full = normalize(join(OUT, path));
  if (!full.startsWith(OUT + sep) && full !== OUT) return null;
  return existsSync(full) && statSync(full).isFile() ? full : null;
}

function resolve(pathname: string): { path: string | null; site: boolean } {
  const site = SITE_RE.exec(pathname);
  const candidates = [pathname, `${pathname}.html`, join(pathname, "index.html")];
  // Next 16 fragt Segment-Prefetches als __next.lab.__PAGE__.txt an, exportiert sie aber
  // als __next.lab/__PAGE__.txt. Gleiche Regel wie in deploy/Caddyfile.
  const segment = /^(.*)\/__next\.([^./]+)\.(.+\.txt)$/.exec(pathname);
  if (segment) candidates.push(`${segment[1]}/__next.${segment[2]}/${segment[3]}`);
  if (site) candidates.push(`/sites/${site[1]}/${site[2]}/index.html`);
  for (const c of candidates) {
    const hit = file(c);
    if (hit) return { path: hit, site: Boolean(site) };
  }
  return { path: null, site: Boolean(site) };
}

createServer((req, res) => {
  const pathname = decodeURIComponent(new URL(req.url ?? "/", "http://x").pathname);
  const { path, site } = resolve(pathname);
  if (site) {
    res.setHeader("Content-Security-Policy", SANDBOX);
    // Die Sandbox macht die Origin undurchsichtig ("null"). Module-Skripte und Fonts
    // laden im CORS-Modus und brauchen deshalb diesen Header, obwohl sie vom selben Host kommen.
    res.setHeader("Access-Control-Allow-Origin", "*");
  }
  if (!path) {
    res.writeHead(404, { "Content-Type": TYPES[".html"] });
    res.end(file("/404.html") ? readFileSync(join(OUT, "404.html")) : "Not found");
    return;
  }
  res.writeHead(200, { "Content-Type": TYPES[extname(path).toLowerCase()] ?? "application/octet-stream" });
  res.end(readFileSync(path));
}).listen(PORT, () => console.log(`Vorschau: http://localhost:${PORT}`));
