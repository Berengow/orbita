import { publicAsset } from "@/lib/tour/public-asset";
import type { Hotspot, Project, Scene } from "./types";
import { blankHotspot, defaultModules, defaultSettings, defaultTheme, uid } from "./presets";

function asset(path: string): string {
  return publicAsset(path);
}

async function loadDemoImage(name: string): Promise<Blob> {
  const response = await fetch(asset(`demo/${name}.jpg`));
  if (!response.ok) throw new Error("Не удалось открыть демо-панораму");
  return response.blob();
}

export function makeAmbientWav(): Blob {
  const sampleRate = 22050;
  const seconds = 4;
  const n = sampleRate * seconds;
  const samples = new Float32Array(n);
  const freqs = [110, 165, 220, 330];
  for (let i = 0; i < n; i++) {
    const t = i / sampleRate;
    let s = 0;
    for (let k = 0; k < freqs.length; k++) {
      const f = freqs[k];
      s += Math.sin(2 * Math.PI * f * t) * (0.07 - k * 0.012);
      s += Math.sin(2 * Math.PI * f * 2 * t) * 0.012;
    }
    const trem = 0.72 + 0.28 * Math.sin(2 * Math.PI * 0.25 * t);
    const env = Math.min(1, i / 1800, (n - i) / 1800);
    samples[i] = s * trem * env;
  }
  const buffer = new ArrayBuffer(44 + n * 2);
  const view = new DataView(buffer);
  const write = (offset: number, text: string) => {
    for (let i = 0; i < text.length; i++) view.setUint8(offset + i, text.charCodeAt(i));
  };
  write(0, "RIFF");
  view.setUint32(4, 36 + n * 2, true);
  write(8, "WAVE");
  write(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  write(36, "data");
  view.setUint32(40, n * 2, true);
  let offset = 44;
  for (let i = 0; i < n; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    offset += 2;
  }
  return new Blob([buffer], { type: "audio/wav" });
}

function hs(kind: Hotspot["kind"], yaw: number, pitch: number, title: string, extra: Partial<Hotspot>): Hotspot {
  return blankHotspot({
    id: uid("hs"),
    kind,
    yaw,
    pitch,
    title,
    text: "",
    targetSceneId: "",
    url: "",
    ...extra,
  });
}

function makeScene(
  name: string,
  description: string,
  imageId: string,
  yaw: number,
  mapX: number,
  mapY: number,
  intro: boolean,
): Scene {
  return {
    id: uid("scn"),
    name,
    description,
    imageId,
    yaw,
    pitch: 0,
    hfov: 100,
    mapX,
    mapY,
    group: intro ? "Первый этаж" : name === "Атриум" ? "Свет" : "Первый этаж",
    featured: name === "Галерея",
    pointColor: "",
    thumbId: "",
    caption: "",
    hotspots: [],
    modules: defaultModules({ intro }),
  };
}

export async function createDemoBundle(): Promise<{ project: Project; blobs: Record<string, Blob> }> {
  const hallImg = uid("img");
  const galleryImg = uid("img");
  const atriumImg = uid("img");
  const audioId = uid("aud");
  const blobs: Record<string, Blob> = {
    [hallImg]: await loadDemoImage("hall"),
    [galleryImg]: await loadDemoImage("gallery"),
    [atriumImg]: await loadDemoImage("atrium"),
    [audioId]: makeAmbientWav(),
  };

  const hall = makeScene(
    "Зал",
    "Первый зал. Отсюда тур уходит в галерею и атриум — страница не перезагружается.",
    hallImg,
    -16,
    28,
    64,
    true,
  );
  const gallery = makeScene(
    "Галерея",
    "Вторая сцена. Карусель и стрелки переключают залы без перезагрузки.",
    galleryImg,
    -34,
    52,
    36,
    false,
  );
  const atrium = makeScene(
    "Атриум",
    "Свет сверху. Точки на панораме ведут обратно и открывают заметки.",
    atriumImg,
    6,
    74,
    68,
    false,
  );

  hall.hotspots = [
    hs("scene", -16, 2, "В галерею", { targetSceneId: gallery.id }),
    hs("scene", 48, 0, "В атриум", { targetSceneId: atrium.id }),
  ];
  gallery.hotspots = [
    hs("scene", -34, 2, "Обратно в зал", { targetSceneId: hall.id }),
    hs("info", 22, 0, "О раме", {
      text: "Цветные порталы — это точки перехода. В своём туре на их место встанут дверные проёмы и экспонаты.",
    }),
  ];
  atrium.hotspots = [
    hs("scene", 6, 2, "В галерею", { targetSceneId: gallery.id }),
    hs("info", -72, -2, "Окулус", {
      text: "Поднимите взгляд: кольцо на потолке — зенит. Так выглядит отметка с текстом.",
    }),
  ];

  const settings = defaultSettings();
  settings.audioId = audioId;
  settings.audioName = "Демо-амбиент";
  settings.introTitle = "Демо-тур ORBITA";
  settings.introSubtitle = "Три зала, точки перехода и карточка. Всё это уедет одним ZIP на любой хостинг.";
  settings.aboutTitle = "Как смотреть";
  settings.aboutBody =
    "Крутите зал мышью или пальцем. Точки ведут между сценами. Стрелки и карусель переключают залы сразу, без новой страницы.";

  const project: Project = {
    version: 1,
    id: uid("prj"),
    name: "Демо-тур",
    updatedAt: Date.now(),
    theme: { ...defaultTheme(), pointShape: "diamond" },
    settings,
    scenes: [hall, gallery, atrium],
    activeSceneId: gallery.id,
  };

  return { project, blobs };
}
