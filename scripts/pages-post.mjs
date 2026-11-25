#!/usr/bin/env node
/**
 * After `ORBITA_PAGES=1` vite build: make the client output a GitHub Pages site.
 * Copies the SPA shell to 404.html (Pages serves it for unknown paths) and
 * ensures .nojekyll so folders like __grok are not dropped by Jekyll.
 */
import { copyFileSync, existsSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const candidates = [join(root, "dist", "client"), join(root, ".output", "public"), join(root, "dist")];

function hasIndex(dir) {
  return existsSync(join(dir, "index.html"));
}

const out = candidates.find(hasIndex);
if (!out) {
  console.error("pages-post: index.html not found in", candidates.join(", "));
  process.exit(1);
}

const htmlPath = join(out, "index.html");
let html = readFileSync(htmlPath, "utf8");
const assetDir = join(out, "assets");
const cssFiles = existsSync(assetDir)
  ? readdirSync(assetDir).filter((name) => name.endsWith(".css") && name.startsWith("styles"))
  : [];
if (cssFiles.length === 0) {
  console.error("pages-post: styles css was not emitted");
  process.exit(1);
}
const cssName = cssFiles.find((name) => html.includes(`/orbita/assets/${name}`)) ?? cssFiles[0];
const cssHref = `/orbita/assets/${cssName}`;
html = html.replace(/\/orbita\/assets\/styles[^"]*\.css/g, cssHref);
if (!html.includes(cssHref)) {
  console.error("pages-post: stylesheet link was not rewritten");
  process.exit(1);
}
writeFileSync(htmlPath, html);
copyFileSync(htmlPath, join(out, "404.html"));
writeFileSync(join(out, ".nojekyll"), "\n");

const manifest = {
  name: "ORBITA",
  short_name: "ORBITA",
  id: "/orbita/",
  start_url: "/orbita/",
  scope: "/orbita/",
  display: "standalone",
  background_color: "#100e0c",
  theme_color: "#100e0c",
  icons: [{ src: "/orbita/__grok/icon-180.png", sizes: "180x180", type: "image/png" }],
};
writeFileSync(join(out, "__grok", "manifest.webmanifest"), `${JSON.stringify(manifest, null, 2)}\n`);

const player = existsSync(join(out, "player", "index.html"));
const pano = existsSync(join(out, "vendor", "pannellum", "pannellum.js"));
const demo = existsSync(join(out, "demo", "hall.jpg"));
if (!player || !pano || !demo) {
  console.error("pages-post: site is missing player, pannellum or demo panoramas", { player, pano, demo });
  process.exit(1);
}

const readme = `# ORBITA

Это сам конструктор панорам, а не готовый тур.

Открывается здесь: https://berengow.github.io/orbita/

Проекты хранятся в браузере на этом устройстве. Готовый тур скачивается кнопкой «Скачать сайт» и его можно выложить отдельно.

Публикация: Settings → Pages → Deploy from a branch → \`main\` → \`/ (root)\`.

Исходники конструктора: ветка \`source\`.
`;
writeFileSync(join(out, "README.md"), readme);

const files = readdirSync(out);
console.log("pages-post:", out);
console.log(files.slice(0, 40).join("\n"));
console.log("bytes", statSync(join(out, "index.html")).size);
