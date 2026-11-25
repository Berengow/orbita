import type {
  CarouselPlacement,
  LogoPlacement,
  PointShape,
  SceneModules,
  Settings,
  Theme,
} from "./types";

export interface ThemePreset {
  id: string;
  name: string;
  swatch: string;
  accent: string;
  panel: string;
  text: string;
  point: string;
}

export const PRESETS: ThemePreset[] = [
  { id: "coal", name: "Уголь", swatch: "#e29a3a", accent: "#e29a3a", panel: "#161311", text: "#f6f1ea", point: "#e29a3a" },
  { id: "lagoon", name: "Лагуна", swatch: "#3ec6c0", accent: "#3ec6c0", panel: "#10211f", text: "#e7f6f4", point: "#7ee0c8" },
  { id: "bone", name: "Кость", swatch: "#d7c4ae", accent: "#8c5a3c", panel: "#f3efe8", text: "#241c16", point: "#c47a4a" },
  { id: "pine", name: "Хвоя", swatch: "#b6d36a", accent: "#b6d36a", panel: "#141812", text: "#eef3e4", point: "#c6e07a" },
  { id: "ink", name: "Тушь", swatch: "#f4f4f4", accent: "#f4f4f4", panel: "#0e0e10", text: "#f7f7f7", point: "#ffffff" },
  { id: "wine", name: "Вино", swatch: "#e07088", accent: "#e07088", panel: "#1a1014", text: "#f8ecee", point: "#e07088" },
];

export const FONTS: { id: string; label: string }[] = [
  { id: "Manrope", label: "Manrope" },
  { id: "Golos Text", label: "Golos Text" },
  { id: "Geologica", label: "Geologica" },
  { id: "Unbounded", label: "Unbounded" },
  { id: "Literata", label: "Literata" },
];

export const SHAPES: { id: PointShape; label: string }[] = [
  { id: "circle", label: "Круг" },
  { id: "diamond", label: "Ромб" },
  { id: "square", label: "Квадрат" },
];

export const CAROUSEL_PLACEMENTS: { id: CarouselPlacement; label: string }[] = [
  { id: "bottom", label: "Снизу" },
  { id: "left", label: "Слева" },
  { id: "right", label: "Справа" },
];

export const LOGO_PLACEMENTS: { id: LogoPlacement; label: string }[] = [
  { id: "top-left", label: "Слева сверху" },
  { id: "top-center", label: "По центру" },
  { id: "top-right", label: "Справа сверху" },
];

export function defaultModules(partial?: Partial<SceneModules>): SceneModules {
  return {
    carousel: true,
    logo: true,
    about: false,
    hotspots: true,
    labels: true,
    minimap: false,
    infoCard: true,
    compass: false,
    sceneTitle: true,
    arrows: true,
    fullscreen: true,
    loader: true,
    intro: false,
    ...partial,
  };
}

export function defaultTheme(): Theme {
  const coal = PRESETS[0];
  return {
    preset: coal.id,
    accent: coal.accent,
    panel: coal.panel,
    text: coal.text,
    point: coal.point,
    font: "Manrope",
    radius: 16,
    opacity: 0.78,
    blur: 18,
    pointScale: 1,
    pointShape: "diamond",
    uiScale: 1,
  };
}

export function defaultSettings(): Settings {
  return {
    soundEnabled: false,
    autorotate: false,
    autorotateSpeed: -1.6,
    gyro: false,
    minHfov: 50,
    maxHfov: 120,
    carouselPlacement: "bottom",
    logoPlacement: "top-left",
    logoText: "ORBITA",
    logoId: "",
    aboutTitle: "Об аудитории",
    aboutBody:
      "Коротко для тех, кто смотрит тур вместе: что это за место, куда идти дальше и на что обратить внимание.",
    audioId: "",
    audioName: "",
    introTitle: "Добро пожаловать",
    introSubtitle: "Осмотритесь. Точки на стенах ведут в соседние залы.",
    introButton: "Начать просмотр",
    northOffset: 0,
  };
}

export function uid(prefix: string): string {
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  const body = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  return `${prefix}_${body}`;
}

export function plural(n: number, one: string, few: string, many: string): string {
  const n10 = n % 10;
  const n100 = n % 100;
  if (n10 === 1 && n100 !== 11) return `${n} ${one}`;
  if (n10 >= 2 && n10 <= 4 && (n100 < 12 || n100 > 14)) return `${n} ${few}`;
  return `${n} ${many}`;
}

const CY: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh", з: "z", и: "i", й: "i",
  к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f",
  х: "h", ц: "ts", ч: "ch", ш: "sh", щ: "sch", ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya",
};

export function slugify(name: string): string {
  const raw = name
    .trim()
    .toLowerCase()
    .split("")
    .map((ch) => CY[ch] ?? ch)
    .join("");
  const out = raw.replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return out || "tour";
}

export function sceneTitleFromFile(name: string): string {
  const base = name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").trim();
  if (!base) return "Сцена";
  return base.charAt(0).toUpperCase() + base.slice(1);
}
