import { describe, expect, it } from "vitest";
import { rewriteFile, rewriteKnownDirs, rewriteKnownPaths, rewriteViteBase } from "./rewrite";

const P = "/sites/websites/demo/";

describe("rewriteFile", () => {
  it("prefixes root-absolute asset urls in html and leaves external ones alone", () => {
    const html = '<script type="module" src="/assets/index.js"></script><a href="/">Home</a><img src="https://cdn.x/y.png">';
    expect(rewriteFile(html, ".html", P)).toBe(
      `<script type="module" src="${P}assets/index.js"></script><a href="${P}">Home</a><img src="https://cdn.x/y.png">`,
    );
  });

  it("never prefixes twice", () => {
    const once = rewriteFile('<link href="/style.css">', ".html", P);
    expect(rewriteFile(once, ".html", P)).toBe(once);
  });

  it("rewrites css urls and imports", () => {
    expect(rewriteFile("a{background:url(/img/bg.png)}@import '/base.css';", ".css", P)).toBe(
      `a{background:url(${P}img/bg.png)}@import '${P}base.css';`,
    );
  });

  it("rewrites next.js runtime paths but not foreign hosts", () => {
    expect(rewriteFile('"/_next/static/a.js" "https://x.com/_next/b.js"', ".js", P)).toBe(
      `"${P}_next/static/a.js" "https://x.com/_next/b.js"`,
    );
  });
});

describe("existence-checked rewriting", () => {
  const files = new Set(["logos/claude.svg", "assets/app.js"]);

  it("only touches paths that exist in the artifact", () => {
    expect(rewriteKnownPaths('src:`/logos/claude.svg`,api:"/api/chat"', P, files)).toBe(
      `src:\`${P}logos/claude.svg\`,api:"/api/chat"`,
    );
  });

  it("handles template paths into known folders", () => {
    const input = "src:`/logos/${id}.svg`,x:'/other/'+id";
    expect(rewriteKnownDirs(input, P, files)).toBe(`src:\`${P}logos/\${id}.svg\`,x:'/other/'+id`);
  });

  it("fixes the vite runtime base for lazy chunks", () => {
    expect(rewriteViteBase('G=function(d){return"/"+d}', P)).toBe(`G=function(d){return"${P}"+d}`);
  });
});
