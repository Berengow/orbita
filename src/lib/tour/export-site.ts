import * as idb from "./idb";
import { downloadBlob } from "./download";
import { toPlayerTour } from "./payload";
import { publicAsset } from "./public-asset";
import { slugify } from "./presets";
import type { ExportQuality, PlayerTour, Project } from "./types";

const QUALITY: Record<ExportQuality, { width: number | null; q: number }> = {
  compact: { width: 1600, q: 0.76 },
  balanced: { width: 2560, q: 0.82 },
  high: { width: 4096, q: 0.86 },
  original: { width: null, q: 0.92 },
};

function extOf(blob: Blob, fallback: string): string {
  if (blob.type.includes("png")) return "png";
  if (blob.type.includes("webp")) return "webp";
  if (blob.type.includes("wav")) return "wav";
  if (blob.type.includes("mpeg") || blob.type.includes("mp3")) return "mp3";
  if (blob.type.includes("ogg")) return "ogg";
  if (blob.type.includes("jpeg")) return "jpg";
  return fallback;
}

async function loadImage(blob: Blob): Promise<ImageBitmap | HTMLImageElement> {
  try {
    return await createImageBitmap(blob);
  } catch {
    const url = URL.createObjectURL(blob);
    try {
      const image = new Image();
      image.src = url;
      await image.decode();
      return image;
    } finally {
      URL.revokeObjectURL(url);
    }
  }
}

async function toJpeg(blob: Blob, width: number | null, quality: number): Promise<Blob> {
  if (!width) {
    if (blob.type.includes("jpeg") || blob.type.includes("png") || blob.type.includes("webp")) return blob;
  }
  const source = await loadImage(blob);
  const srcW = "width" in source ? source.width : 0;
  const srcH = "height" in source ? source.height : 0;
  const scale = width ? Math.min(1, width / srcW) : 1;
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(2, Math.round(srcW * scale));
  canvas.height = Math.max(2, Math.round(srcH * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Не удалось подготовить изображение");
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  if ("close" in source) source.close();
  const out = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
  if (!out) throw new Error("Не удалось сжать панораму");
  return out;
}

async function textAsset(path: string): Promise<string> {
  const res = await fetch(publicAsset(path));
  if (!res.ok) throw new Error(`Не найден файл ${path}`);
  return res.text();
}

async function binAsset(path: string): Promise<ArrayBuffer> {
  const res = await fetch(publicAsset(path));
  if (!res.ok) throw new Error(`Не найден файл ${path}`);
  return res.arrayBuffer();
}

function safeId(id: string): string {
  const clean = id.replace(/[^a-z0-9_-]/gi, "").slice(0, 80);
  return clean || "file";
}

function embedJson(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

function readme(project: Project): string {
  return `ORBITA — ${project.name}

Готовый сайт виртуального тура. Сервер, база и конструктор не нужны.
Все пути относительные: сайт открывается и с корня домена, и из подпапки.

GitHub Pages
1. Создайте репозиторий и залейте В КОРЕНЬ распакованную папку
   (index.html рядом с player/, vendor/, panoramas/). Не заворачивайте
   сайт во вложенную папку, если Pages публикует корень репозитория.
2. Файл .nojekyll уже внутри — без него Pages прячет часть файлов.
3. Settings → Pages → Deploy from a branch → ветка main, папка / (root).
4. Сайт пользователя: https://USER.github.io/
   Сайт проекта:     https://USER.github.io/REPO/
   Оба варианта работают, страницу обновлять не нужно.
5. Если открыли несуществующий адрес, 404.html вернёт на корень тура.

Другой хостинг
Распакуйте архив и залейте содержимое на Nginx, Netlify или FTP.
Откройте index.html. Надёжнее по http(s), чем как локальный файл.
`;
}

const NOT_FOUND = `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="utf-8" />
  <title>ORBITA</title>
  <script>
    (function () {
      var path = location.pathname;
      var cut = path.replace(/\\/+$/, "").replace(/\\/[^/]*$/, "");
      var next = (cut || "") + "/";
      if (next !== path) location.replace(next);
    })();
  </script>
</head>
<body>
  <p><a href="./">Открыть тур</a></p>
</body>
</html>
`;

function page(title: string, tour: PlayerTour): string {
  const data = embedJson(tour);
  return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="Виртуальный тур «${escapeHtml(title)}», собранный в ORBITA." />
  <link rel="icon" href="favicon.svg" type="image/svg+xml" />
  <link rel="stylesheet" href="vendor/pannellum/pannellum.css" />
  <link rel="stylesheet" href="player/fonts.css" />
  <link rel="stylesheet" href="player/player.css" />
</head>
<body>
  <div id="app"></div>
  <script>
    window.ORBITA_STANDALONE = true;
    (function () {
      var href = location.href.split("#")[0].split("?")[0];
      if (!/\\/[^/]+\\.[a-z0-9]+$/i.test(location.pathname) && href.slice(-1) !== "/") href += "/";
      window.ORBITA_BASE = new URL(".", href).href;
    })();
    window.TOUR = ${data};
  </script>
  <script src="vendor/pannellum/pannellum.js"></script>
  <script src="player/player.js"></script>
</body>
</html>
`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "\u0026amp;")
    .replace(/</g, "\u0026lt;")
    .replace(/>/g, "\u0026gt;")
    .replace(/"/g, "\u0026quot;");
}

export async function exportSiteZip(project: Project, quality: ExportQuality): Promise<void> {
  const { default: JSZip } = await import("jszip");
  const zip = new JSZip();
  const spec = QUALITY[quality];
  const urls: Record<string, string> = {};

  for (const scene of project.scenes) {
    const blob = await idb.getBlob(scene.imageId);
    if (!blob) throw new Error(`Нет фото у сцены «${scene.name}»`);
    const image = quality === "original" ? blob : await toJpeg(blob, spec.width, spec.q);
    const ext = quality === "original" ? extOf(blob, "jpg") : "jpg";
    const path = `panoramas/${safeId(scene.id)}.${ext}`;
    zip.file(path, image);
    urls[scene.imageId] = path;
  }

  if (project.settings.logoId) {
    const blob = await idb.getBlob(project.settings.logoId);
    if (blob) {
      const path = `media/logo.${extOf(blob, "png")}`;
      zip.file(path, blob);
      urls[project.settings.logoId] = path;
    }
  }
  if (project.settings.audioId) {
    const blob = await idb.getBlob(project.settings.audioId);
    if (blob) {
      const path = `media/audio.${extOf(blob, "mp3")}`;
      zip.file(path, blob);
      urls[project.settings.audioId] = path;
    }
  }

  const tour = toPlayerTour(project, urls, { mode: "play", placeKind: null, selectedHotspotId: null });
  const start = project.settings.startSceneId;
  if (start && tour.scenes.some((scene) => scene.id === start)) tour.activeSceneId = start;
  zip.file("index.html", page(project.name, tour));
  zip.file("404.html", NOT_FOUND);
  zip.file(".nojekyll", "");
  zip.file("README.txt", readme(project));
  try {
    zip.file("favicon.svg", await textAsset("favicon.svg"));
  } catch {
    /* icon is optional */
  }
  zip.file("player/player.js", await textAsset("player/player.js"));
  zip.file("player/player.css", await textAsset("player/player.css"));
  zip.file("vendor/pannellum/pannellum.js", await textAsset("vendor/pannellum/pannellum.js"));
  zip.file("vendor/pannellum/pannellum.css", await textAsset("vendor/pannellum/pannellum.css"));

  const fontsCss = await textAsset("player/fonts.css");
  zip.file("player/fonts.css", fontsCss);
  const names = new Set([...fontsCss.matchAll(/fonts\/([^")]+)/g)].map((match) => match[1]));
  for (const name of names) {
    zip.file(`player/fonts/${name}`, await binAsset(`player/fonts/${name}`));
  }

  const out = await zip.generateAsync({ type: "blob" });
  downloadBlob(out, `${slugify(project.name)}-site.zip`);
}
