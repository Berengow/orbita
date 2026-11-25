import type {
  CarouselPlacement,
  Hotspot,
  HotspotIcon,
  HotspotKind,
  HotspotMotion,
  HotspotSurface,
  LogoPlacement,
  NavStyle,
  PointShape,
  Project,
  Scene,
  SceneModules,
  SceneTransition,
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
  // Minimal / Clean
  { id: "coal", name: "Уголь", swatch: "#e29a3a", accent: "#e29a3a", panel: "#161311", text: "#f6f1ea", point: "#e29a3a" },
  { id: "ink", name: "Тушь", swatch: "#f4f4f4", accent: "#ffffff", panel: "#0e0e10", text: "#f7f7f7", point: "#ffffff" },
  { id: "bone", name: "Кость", swatch: "#d7c4ae", accent: "#8c5a3c", panel: "#f3efe8", text: "#241c16", point: "#c47a4a" },
  { id: "paper", name: "Бумага", swatch: "#f8f6f2", accent: "#1a1a1a", panel: "#ffffff", text: "#1a1a1a", point: "#333333" },
  // Luxury / Dark
  { id: "wine", name: "Вино", swatch: "#e07088", accent: "#e07088", panel: "#1a1014", text: "#f8ecee", point: "#e07088" },
  { id: "noir", name: "Нуар", swatch: "#c9a96e", accent: "#c9a96e", panel: "#0d0d0d", text: "#f0e6d2", point: "#c9a96e" },
  { id: "obsidian", name: "Обсидиан", swatch: "#6b7cff", accent: "#6b7cff", panel: "#0a0a12", text: "#e8eaf6", point: "#8b9aff" },
  // Soft / Light
  { id: "lagoon", name: "Лагуна", swatch: "#3ec6c0", accent: "#3ec6c0", panel: "#10211f", text: "#e7f6f4", point: "#7ee0c8" },
  { id: "sage", name: "Шалфей", swatch: "#a8c5b0", accent: "#5a8a6e", panel: "#f4f7f5", text: "#1e2a24", point: "#5a8a6e" },
  { id: "blush", name: "Румянец", swatch: "#f4c2c2", accent: "#d4a5a5", panel: "#fdf8f8", text: "#3d2a2a", point: "#c97b7b" },
  // Architectural / Real Estate
  { id: "stone", name: "Камень", swatch: "#8b8680", accent: "#5c5854", panel: "#2a2725", text: "#f0ece8", point: "#c4b8a8" },
  { id: "marble", name: "Мрамор", swatch: "#e8e4df", accent: "#9a8f85", panel: "#f7f5f3", text: "#2c2825", point: "#7a6e64" },
  { id: "pine", name: "Хвоя", swatch: "#b6d36a", accent: "#b6d36a", panel: "#141812", text: "#eef3e4", point: "#c6e07a" },
  // Editorial / Gallery
  { id: "gallery", name: "Галерея", swatch: "#f0f0f0", accent: "#111111", panel: "#ffffff", text: "#111111", point: "#000000" },
  { id: "editorial", name: "Редакция", swatch: "#1a1a1a", accent: "#ff3b30", panel: "#0f0f0f", text: "#f5f5f5", point: "#ff3b30" },
  // Warm / Cold
  { id: "amber", name: "Янтарь", swatch: "#ffb347", accent: "#ff9f1c", panel: "#1c140e", text: "#fff5e6", point: "#ffb347" },
  { id: "arctic", name: "Арктика", swatch: "#a8d8ea", accent: "#6eb5d0", panel: "#0e1a22", text: "#e8f4f8", point: "#a8d8ea" },
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

export const NAV_STYLES: { id: NavStyle; label: string; hint: string }[] = [
  { id: "strip", label: "Лента", hint: "Превью в ряд, со скроллом и привязкой к краю" },
  { id: "side", label: "Колонка", hint: "Вертикальная панель слева или справа" },
  { id: "float", label: "Плавающая", hint: "Ленту можно перетащить за ручку" },
  { id: "grid", label: "Сетка", hint: "Плитка всех сцен по кнопке" },
  { id: "radial", label: "Круг", hint: "Кольцо сцен вокруг кнопки, удобно для коротких туров" },
  { id: "groups", label: "Группы", hint: "Сцены собираются по полю «Группа»: этажи, зоны, темы" },
  { id: "search", label: "Поиск", hint: "Список с фильтром по названию, группе и описанию" },
  { id: "minimal", label: "Счётчик", hint: "Только стрелки и номер сцены" },
  { id: "sheet", label: "Шторка", hint: "Нижняя панель в духе телефона" },
  { id: "hotspots", label: "Только точки", hint: "Без карусели: переход по точкам и мини-карте" },
];

export const TRANSITIONS: { id: SceneTransition; label: string }[] = [
  { id: "fade", label: "Проявление" },
  { id: "zoom", label: "Наезд" },
  { id: "none", label: "Без анимации" },
];

export const MOTIONS: { id: HotspotMotion; label: string }[] = [
  { id: "none", label: "Нет" },
  { id: "pulse", label: "Пульс" },
  { id: "bounce", label: "Прыжок" },
  { id: "glow", label: "Свечение" },
  { id: "rotate", label: "Вращение" },
];

export const HOTSPOT_ICONS: { id: HotspotIcon; label: string }[] = [
  { id: "auto", label: "По типу" },
  { id: "arrow", label: "Стрелка" },
  { id: "door", label: "Дверь" },
  { id: "info", label: "Инфо" },
  { id: "link", label: "Ссылка" },
  { id: "image", label: "Кадр" },
  { id: "camera", label: "Камера" },
  { id: "video", label: "Видео" },
  { id: "play", label: "Play" },
  { id: "audio", label: "Звук" },
  { id: "pin", label: "Метка" },
  { id: "star", label: "Звезда" },
  { id: "map", label: "Карта" },
  { id: "doc", label: "Документ" },
  { id: "heart", label: "Сердце" },
  { id: "compass", label: "Компас" },
  { id: "eye", label: "Взгляд" },
];

export const SURFACES: { id: HotspotSurface; label: string }[] = [
  { id: "modal", label: "Окно по центру" },
  { id: "panel", label: "Боковая панель" },
  { id: "tooltip", label: "Карточка снизу" },
  { id: "direct", label: "Сразу открыть" },
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

const KINDS = new Set<HotspotKind>(["scene", "info", "link", "image", "video", "audio"]);
const ICONS = new Set<HotspotIcon>(HOTSPOT_ICONS.map((item) => item.id));
const MOTION_SET = new Set<HotspotMotion>(MOTIONS.map((item) => item.id));
const SURFACE_SET = new Set<HotspotSurface>(SURFACES.map((item) => item.id));
const NAVS = new Set<NavStyle>(NAV_STYLES.map((item) => item.id));
const SHAPE_SET = new Set<PointShape>(SHAPES.map((item) => item.id));

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
    shadow: 22,
    gap: 8,
    hotspotMotion: "pulse",
    customCss: "",
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
    nav: "strip",
    transition: "fade",
    thumbSize: 96,
    hideBrand: false,
    guide: false,
    guideSeconds: 8,
    deepLink: true,
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

export function blankHotspot(partial: Pick<Hotspot, "id" | "kind" | "yaw" | "pitch"> & Partial<Hotspot>): Hotspot {
  return {
    title: "",
    text: "",
    targetSceneId: "",
    url: "",
    icon: "auto",
    motion: "theme",
    surface: partial.kind === "link" ? "direct" : "modal",
    ...partial,
  };
}

function num(value: unknown, fallback: number, min: number, max: number): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

function hex(value: unknown): string {
  return typeof value === "string" && /^#[0-9a-fA-F]{6}$/.test(value) ? value : "";
}

/** Fill fields added after the first release so old browser drafts keep opening. */
export function normalizeProject(project: Project): Project {
  const theme = { ...defaultTheme(), ...(project.theme ?? {}) };
  if (!SHAPE_SET.has(theme.pointShape)) theme.pointShape = "diamond";
  if (!MOTION_SET.has(theme.hotspotMotion)) theme.hotspotMotion = "pulse";
  if (!theme.font) theme.font = "Manrope";
  theme.radius = num(theme.radius, 16, 0, 28);
  theme.opacity = num(theme.opacity > 1 ? theme.opacity / 100 : theme.opacity, 0.78, 0.45, 1);
  theme.blur = num(theme.blur, 18, 0, 32);
  theme.pointScale = num(theme.pointScale > 3 ? theme.pointScale / 100 : theme.pointScale, 1, 0.7, 1.6);
  theme.uiScale = num(theme.uiScale > 2 ? theme.uiScale / 100 : theme.uiScale, 1, 0.85, 1.25);
  theme.shadow = num(theme.shadow, 22, 0, 48);
  theme.gap = num(theme.gap, 8, 4, 24);
  theme.customCss = String(theme.customCss || "").slice(0, 4000);
  project.theme = theme;

  const settings = { ...defaultSettings(), ...(project.settings ?? {}) };
  if (!NAVS.has(settings.nav)) settings.nav = "strip";
  if (settings.transition !== "fade" && settings.transition !== "zoom" && settings.transition !== "none") {
    settings.transition = "fade";
  }
  if (settings.carouselPlacement !== "bottom" && settings.carouselPlacement !== "left" && settings.carouselPlacement !== "right") {
    settings.carouselPlacement = "bottom";
  }
  if (settings.logoPlacement !== "top-left" && settings.logoPlacement !== "top-center" && settings.logoPlacement !== "top-right") {
    settings.logoPlacement = "top-left";
  }
  settings.thumbSize = num(settings.thumbSize, 96, 64, 140);
  settings.guideSeconds = num(settings.guideSeconds, 8, 3, 60);
  settings.minHfov = num(settings.minHfov, 50, 30, 90);
  settings.maxHfov = num(settings.maxHfov, 120, 90, 140);
  settings.autorotateSpeed = num(settings.autorotateSpeed, -1.6, -8, 8);
  settings.northOffset = num(settings.northOffset, 0, 0, 360);
  settings.hideBrand = Boolean(settings.hideBrand);
  settings.guide = Boolean(settings.guide);
  settings.deepLink = settings.deepLink !== false;
  project.settings = settings;

  project.scenes = (project.scenes ?? []).map((scene) => normalizeScene(scene));
  if (!project.scenes.some((scene) => scene.id === project.activeSceneId)) {
    project.activeSceneId = project.scenes[0]?.id ?? "";
  }
  return project;
}

function normalizeScene(scene: Scene): Scene {
  const next: Scene = {
    id: scene.id,
    name: scene.name || "Сцена",
    description: scene.description || "",
    imageId: scene.imageId || "",
    yaw: num(scene.yaw, 0, -360, 360),
    pitch: num(scene.pitch, 0, -90, 90),
    hfov: num(scene.hfov, 100, 30, 140),
    mapX: num(scene.mapX, 50, 0, 100),
    mapY: num(scene.mapY, 50, 0, 100),
    group: String(scene.group || ""),
    featured: Boolean(scene.featured),
    pointColor: hex(scene.pointColor),
    modules: { ...defaultModules(), ...(scene.modules ?? {}) },
    hotspots: (scene.hotspots ?? []).map((hotspot) => normalizeHotspot(hotspot)),
  };
  return next;
}

function normalizeHotspot(hotspot: Hotspot): Hotspot {
  const kind = KINDS.has(hotspot.kind) ? hotspot.kind : "info";
  const surface = SURFACE_SET.has(hotspot.surface) ? hotspot.surface : kind === "link" ? "direct" : "modal";
  const motion = hotspot.motion === "theme" || MOTION_SET.has(hotspot.motion as HotspotMotion) ? hotspot.motion : "theme";
  return {
    id: hotspot.id,
    kind,
    yaw: num(hotspot.yaw, 0, -360, 360),
    pitch: num(hotspot.pitch, 0, -90, 90),
    title: hotspot.title || "",
    text: hotspot.text || "",
    targetSceneId: hotspot.targetSceneId || "",
    url: hotspot.url || "",
    icon: ICONS.has(hotspot.icon) ? hotspot.icon : "auto",
    motion,
    surface,
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
