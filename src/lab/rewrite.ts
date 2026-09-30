/**
 * Modell-Artefakte sind für die Wurzel einer Domain gebaut ("/assets/x.js",
 * "/_next/..."). Ausgeliefert werden sie unter /sites/<sammlung>/<lauf>/. Diese
 * Umschreibung läuft beim Build auf einer Kopie; lab/**\/dist bleibt unverändert.
 *
 * Übernommen aus dem alten Portfolio (nextjs/scripts/build-test-index.mjs), wo
 * sie mit allen heutigen Artefakten erprobt ist — nur der Präfix ist neu.
 */

export const REWRITE_EXTENSIONS = new Set([".html", ".css", ".js", ".mjs", ".json", ".xml", ".txt", ".svg"]);

/** Bereits umgeschriebene Pfade beginnen so und werden nicht doppelt präfixiert. */
const DONE = "sites\\/";

export function rewriteHtml(html: string, prefix: string): string {
  const parts = html.split(/(<base\s[^>]*>)/gi);
  const srcHrefRe = new RegExp(`((?:src|href|action)\\s*=\\s*)(["'])\\/(?!${DONE})((?!\\/)[^"']+)\\2`, "gi");
  const bareHrefRe = /((?:href)\s*=\s*)(["'])\/\2/gi;
  const relativeRe = /((?:src|href|action)\s*=\s*)(["'])(?!\/|https?:\/\/|data:|#|mailto:|tel:|javascript:|\?)([^"']+(?:\.[a-z0-9]+[^"']*)?)\2/gi;
  const rscPathRe = new RegExp(`(href\\\\":\\\\")\\/(?!${DONE})([^"\\\\]+)\\\\"`, "gi");
  const rscBareRe = /href\\":\\"\/\\"/gi;
  const rscKeyRe = new RegExp(`\\\\",\\\\"\\/(?!${DONE}|_next\\/)([^"\\\\]+)\\\\"`, "gi");
  const assetRe = new RegExp(
    `((?:\\\\"|"|'))\\/(?!${DONE})([^"'\\\\\\s>]*\\.(?:js|css|woff2?|ttf|png|svg|jpg|jpeg|gif|ico|json|webp|txt|ico\\?[^"'\\\\\\s>]*))(\\1)`,
    "gi",
  );

  for (let i = 0; i < parts.length; i++) {
    if (/^<base\s/i.test(parts[i])) continue;
    parts[i] = parts[i]
      .replace(bareHrefRe, `$1$2${prefix}$2`)
      .replace(srcHrefRe, `$1$2${prefix}$3$2`)
      .replace(relativeRe, `$1$2${prefix}$3$2`)
      .replace(rscPathRe, `$1${prefix}$2\\"`)
      .replace(rscBareRe, `href\\":\\"${prefix}\\"`)
      .replace(rscKeyRe, `\\",\\"${prefix}$1\\"`)
      .replace(assetRe, (_m, quote: string, rest: string, close: string) => `${quote}${prefix}${rest}${close}`);
  }
  return parts.join("");
}

export function rewriteCss(css: string, prefix: string): string {
  const escaped = prefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return css
    .replace(
      new RegExp(`url\\(\\s*(["']?)(${escaped})?\\/((?!\\/)[^"')]+)\\1\\s*\\)`, "gi"),
      (_m, quote: string, _done: string, rest: string) => `url(${quote}${prefix}${rest}${quote})`,
    )
    .replace(
      new RegExp(`@import\\s+(["'])(${escaped})?\\/((?!\\/)[^"']+)\\1`, "gi"),
      (_m, quote: string, _done: string, rest: string) => `@import ${quote}${prefix}${rest}${quote}`,
    );
}

export function rewriteScript(content: string, prefix: string, extension: string): string {
  let out = content.replace(/(?<![a-z0-9_-])\/_next\//gi, `${prefix}_next/`);
  if (extension === ".js" || extension === ".mjs") {
    out = out
      .replace(new RegExp(`(href:")\\/(?!${DONE}|_next\\/)([^"]+)"`, "gi"), `$1${prefix}$2"`)
      .replace(/(href:")\/"/gi, `$1${prefix}"`);
  }
  if (extension === ".txt" || extension === ".json") {
    out = out
      .replace(new RegExp(`"(href|src)":"\\/(?!${DONE})([^"]+)"`, "gi"), `"$1":"${prefix}$2"`)
      .replace(/"(href|src)":"\/"/gi, `"$1":"${prefix}"`);
  }
  return out;
}

/**
 * Absolute Pfade in beliebigen String-Literalen ("/logos/x.svg" in einem Bundle),
 * aber nur, wenn genau diese Datei im Artefakt liegt. Dadurch trifft die Regel
 * keine API-Routen, externen Pfade oder zufälligen Texte.
 */
export function rewriteKnownPaths(content: string, prefix: string, files: ReadonlySet<string>): string {
  return content.replace(/(["'`])\/([A-Za-z0-9_.~@%+-][^"'`\s?#]*)(?=[?#"'`])/g, (match, quote: string, path: string) =>
    files.has(path) ? `${quote}${prefix}${path}` : match,
  );
}

/** Vites Preload-Helfer baut Chunk-URLs zur Laufzeit: function(e){return"/"+e}. */
export function rewriteViteBase(content: string, prefix: string): string {
  return content.replace(/return(\s*)(["'`])\/\2\+/g, `return$1$2${prefix}$2+`);
}

/** @param files alle Dateien des Artefakts, relativ und mit "/" getrennt */
export function rewriteFile(content: string, extension: string, prefix: string, files: ReadonlySet<string> = new Set()): string {
  let out: string;
  if (extension === ".html") out = rewriteHtml(content, prefix);
  else if (extension === ".css") out = rewriteCss(content, prefix);
  else out = rewriteScript(content, prefix, extension);
  if (extension === ".js" || extension === ".mjs") out = rewriteViteBase(out, prefix);
  return rewriteKnownDirs(rewriteKnownPaths(out, prefix, files), prefix, files);
}

/**
 * Zusammengesetzte Pfade wie `/logos/${id}.svg` oder "/img/"+name: umgeschrieben wird
 * nur, wenn das erste Segment ein Ordner auf oberster Ebene des Artefakts ist.
 */
export function rewriteKnownDirs(content: string, prefix: string, files: ReadonlySet<string>): string {
  const dirs = new Set<string>();
  for (const f of files) {
    const slash = f.indexOf("/");
    if (slash > 0) dirs.add(f.slice(0, slash));
  }
  dirs.delete("sites");
  if (!dirs.size) return content;
  const names = [...dirs].map((d) => d.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
  return content.replace(new RegExp(`(["'\`])/(${names})/`, "g"), `$1${prefix}$2/`);
}
