import { create } from "zustand";
import { createDemoBundle } from "./demo";
import * as idb from "./idb";
import { PRESETS, defaultModules, defaultSettings, defaultTheme, sceneTitleFromFile, uid } from "./presets";
import type { ExportQuality, Hotspot, HotspotKind, Project, ProjectSummary, Scene } from "./types";

export type DialogId = null | "new" | "export" | "help" | "projects";
export type Hist = "push" | "coalesce" | "skip";

interface ViewState {
  yaw: number;
  pitch: number;
  hfov: number;
}

interface TourStore {
  booted: boolean;
  bootError: string;
  projects: ProjectSummary[];
  project: Project | null;
  urls: Record<string, string>;
  history: Project[];
  future: Project[];
  selectedHotspotId: string | null;
  placeKind: HotspotKind | null;
  mode: "edit" | "play";
  view: ViewState;
  mobilePane: "scenes" | "settings" | null;
  dialog: DialogId;
  toast: string | null;
  draggingFiles: boolean;
  busy: string | null;
  boot: () => Promise<void>;
  update: (recipe: (project: Project) => void, hist?: Hist, key?: string) => void;
  undo: () => void;
  redo: () => void;
  setActive: (id: string) => void;
  setPlace: (kind: HotspotKind | null) => void;
  setSelected: (id: string | null) => void;
  setMode: (mode: "edit" | "play") => void;
  setView: (view: ViewState) => void;
  setMobile: (pane: "scenes" | "settings" | null) => void;
  setDialog: (dialog: DialogId) => void;
  setDragging: (value: boolean) => void;
  showToast: (message: string) => void;
  addFiles: (files: File[]) => Promise<void>;
  replaceSceneImage: (sceneId: string, file: File) => Promise<void>;
  addHotspot: (partial: { kind: HotspotKind; yaw: number; pitch: number }) => void;
  moveHotspot: (id: string, yaw: number, pitch: number) => void;
  moveMap: (id: string, x: number, y: number) => void;
  rememberView: (view: ViewState) => void;
  removeScene: (id: string) => void;
  duplicateScene: (id: string) => Promise<void>;
  reorderScenes: (fromId: string, toId: string) => void;
  removeHotspot: (id: string) => void;
  setLogo: (file: File | null) => Promise<void>;
  setAudio: (file: File | null) => Promise<void>;
  applyPreset: (id: string) => void;
  newProject: (name: string, demo: boolean) => Promise<void>;
  openProject: (id: string) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  duplicateProject: () => Promise<void>;
  exportProjectFile: () => Promise<void>;
  importProjectFile: (file: File) => Promise<void>;
  exportSite: (quality: ExportQuality) => Promise<void>;
}

let saveTimer = 0;
let toastTimer = 0;
let coalesce = { key: "", at: 0 };

function queueSave() {
  window.clearTimeout(saveTimer);
  saveTimer = window.setTimeout(() => {
    const project = useTour.getState().project;
    if (project) void idb.saveProject(project);
  }, 280);
}

function summary(project: Project): ProjectSummary {
  return {
    id: project.id,
    name: project.name,
    updatedAt: project.updatedAt,
    sceneCount: project.scenes.length,
  };
}

function upsertSummary(list: ProjectSummary[], project: Project): ProjectSummary[] {
  const next = summary(project);
  const rest = list.filter((item) => item.id !== project.id);
  return [next, ...rest].sort((a, b) => b.updatedAt - a.updatedAt);
}

async function hydrate(project: Project): Promise<Record<string, string>> {
  const urls: Record<string, string> = {};
  const ids = new Set<string>();
  for (const scene of project.scenes) ids.add(scene.imageId);
  if (project.settings.logoId) ids.add(project.settings.logoId);
  if (project.settings.audioId) ids.add(project.settings.audioId);
  for (const id of ids) {
    if (!id) continue;
    const blob = await idb.getBlob(id);
    if (blob) urls[id] = URL.createObjectURL(blob);
  }
  return urls;
}

function revokeUrls(urls: Record<string, string>) {
  for (const url of Object.values(urls)) URL.revokeObjectURL(url);
}

function nextSceneId(project: Project, fromId: string): string {
  if (project.scenes.length === 0) return "";
  const index = project.scenes.findIndex((scene) => scene.id === fromId);
  if (project.scenes.length === 1) return project.scenes[0]?.id ?? "";
  return project.scenes[(Math.max(index, 0) + 1) % project.scenes.length]?.id ?? "";
}

function blankScene(name: string, imageId: string, index: number): Scene {
  return {
    id: uid("scn"),
    name,
    description: "",
    imageId,
    yaw: 0,
    pitch: 0,
    hfov: 100,
    mapX: 18 + (index % 5) * 16,
    mapY: 30 + (index % 3) * 18,
    hotspots: [],
    modules: defaultModules(),
  };
}

function emptyProject(name: string): Project {
  return {
    version: 1,
    id: uid("prj"),
    name: name || "Новый тур",
    updatedAt: Date.now(),
    theme: defaultTheme(),
    settings: defaultSettings(),
    scenes: [],
    activeSceneId: "",
  };
}

async function persistBundle(project: Project, blobs: Record<string, Blob>) {
  for (const [id, blob] of Object.entries(blobs)) await idb.putBlob(id, blob);
  await idb.saveProject(project);
  await idb.setMeta({ lastId: project.id });
}

export const useTour = create<TourStore>((set, get) => ({
  booted: false,
  bootError: "",
  projects: [],
  project: null,
  urls: {},
  history: [],
  future: [],
  selectedHotspotId: null,
  placeKind: null,
  mode: "edit",
  view: { yaw: 0, pitch: 0, hfov: 100 },
  mobilePane: null,
  dialog: null,
  toast: null,
  draggingFiles: false,
  busy: null,

  boot: async () => {
    if (get().booted) return;
    try {
      let projects = await idb.listProjects();
      let meta = await idb.getMeta();
      if (projects.length === 0) {
        const demo = await createDemoBundle();
        await persistBundle(demo.project, demo.blobs);
        projects = [summary(demo.project)];
        meta = { lastId: demo.project.id };
      }
      const id = projects.some((item) => item.id === meta.lastId) ? meta.lastId : projects[0].id;
      const project = await idb.getProject(id);
      if (!project) throw new Error("Проект не найден");
      const urls = await hydrate(project);
      set({ booted: true, projects, project, urls, bootError: "" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Не удалось открыть черновик";
      set({ booted: true, bootError: message });
    }
  },

  update: (recipe, hist = "push", key) => {
    const current = get().project;
    if (!current) return;
    const next = structuredClone(current);
    recipe(next);
    next.updatedAt = Date.now();
    const now = Date.now();
    const sameGesture = hist === "coalesce" && key && coalesce.key === key && now - coalesce.at < 700;
    if (hist === "coalesce" && key) coalesce = { key, at: now };
    set((state) => ({
      project: next,
      projects: upsertSummary(state.projects, next),
      history:
        hist === "skip" || sameGesture
          ? state.history
          : [...state.history, structuredClone(current)].slice(-40),
      future: hist === "skip" || sameGesture ? state.future : [],
    }));
    queueSave();
  },

  undo: () => {
    const { history, project, future } = get();
    const prev = history[history.length - 1];
    if (!prev || !project) return;
    set({
      project: prev,
      history: history.slice(0, -1),
      future: [structuredClone(project), ...future].slice(0, 40),
      projects: upsertSummary(get().projects, prev),
    });
    queueSave();
  },

  redo: () => {
    const { future, project, history } = get();
    const next = future[0];
    if (!next || !project) return;
    set({
      project: next,
      future: future.slice(1),
      history: [...history, structuredClone(project)].slice(-40),
      projects: upsertSummary(get().projects, next),
    });
    queueSave();
  },

  setActive: (id) => {
    const project = get().project;
    if (!project || project.activeSceneId === id) return;
    const next = { ...project, activeSceneId: id, updatedAt: Date.now() };
    set({ project: next, selectedHotspotId: null, projects: upsertSummary(get().projects, next) });
    queueSave();
  },

  setPlace: (placeKind) => set({ placeKind }),
  setSelected: (selectedHotspotId) =>
    set({
      selectedHotspotId,
      mobilePane:
        selectedHotspotId && typeof window !== "undefined" && window.innerWidth < 1024
          ? "settings"
          : get().mobilePane,
    }),
  setMode: (mode) => set({ mode, placeKind: mode === "play" ? null : get().placeKind }),
  setView: (view) => set({ view }),
  setMobile: (mobilePane) => set({ mobilePane }),
  setDialog: (dialog) => set({ dialog }),
  setDragging: (draggingFiles) => set({ draggingFiles }),

  showToast: (message) => {
    window.clearTimeout(toastTimer);
    set({ toast: message });
    toastTimer = window.setTimeout(() => set({ toast: null }), 2800);
  },

  addFiles: async (files) => {
    const project = get().project;
    if (!project || files.length === 0) return;
    const sorted = [...files].sort((a, b) => a.name.localeCompare(b.name, "ru", { numeric: true }));
    const urls = { ...get().urls };
    const scenes: Scene[] = [];
    for (const file of sorted) {
      const imageId = uid("img");
      await idb.putBlob(imageId, file);
      urls[imageId] = URL.createObjectURL(file);
      scenes.push(blankScene(sceneTitleFromFile(file.name), imageId, project.scenes.length + scenes.length));
    }
    set({ urls });
    get().update((draft) => {
      draft.scenes.push(...scenes);
      draft.activeSceneId = scenes[0]?.id ?? draft.activeSceneId;
    });
    get().showToast(sorted.length === 1 ? "Сцена добавлена" : `Добавлено сцен: ${sorted.length}`);
  },

  replaceSceneImage: async (sceneId, file) => {
    const scene = get().project?.scenes.find((item) => item.id === sceneId);
    if (!scene) return;
    await idb.putBlob(scene.imageId, file);
    const urls = { ...get().urls };
    if (urls[scene.imageId]) URL.revokeObjectURL(urls[scene.imageId]);
    urls[scene.imageId] = URL.createObjectURL(file);
    set({ urls });
    get().update((draft) => {
      const target = draft.scenes.find((item) => item.id === sceneId);
      if (target && !target.name) target.name = sceneTitleFromFile(file.name);
    }, "skip");
    get().showToast("Фото заменено");
  },

  addHotspot: ({ kind, yaw, pitch }) => {
    const project = get().project;
    if (!project) return;
    const scene = project.scenes.find((item) => item.id === project.activeSceneId);
    if (!scene) return;
    const target = nextSceneId(project, scene.id);
    const targetName = project.scenes.find((item) => item.id === target)?.name ?? "Переход";
    const hotspot: Hotspot = {
      id: uid("hs"),
      kind,
      yaw,
      pitch,
      title: kind === "scene" ? targetName : kind === "info" ? "Заметка" : "Ссылка",
      text: "",
      targetSceneId: kind === "scene" ? target : "",
      url: "",
    };
    get().update((draft) => {
      const current = draft.scenes.find((item) => item.id === draft.activeSceneId);
      current?.hotspots.push(hotspot);
    });
    set({ selectedHotspotId: hotspot.id });
  },

  moveHotspot: (id, yaw, pitch) => {
    get().update((draft) => {
      for (const scene of draft.scenes) {
        const hotspot = scene.hotspots.find((item) => item.id === id);
        if (hotspot) {
          hotspot.yaw = yaw;
          hotspot.pitch = pitch;
        }
      }
    }, "coalesce", `move:${id}`);
  },

  moveMap: (id, x, y) => {
    get().update((draft) => {
      const scene = draft.scenes.find((item) => item.id === id);
      if (!scene) return;
      scene.mapX = Math.max(6, Math.min(94, x));
      scene.mapY = Math.max(8, Math.min(92, y));
    }, "coalesce", `map:${id}`);
  },

  rememberView: (view) => {
    get().update((draft) => {
      const scene = draft.scenes.find((item) => item.id === draft.activeSceneId);
      if (!scene) return;
      scene.yaw = view.yaw;
      scene.pitch = view.pitch;
      scene.hfov = view.hfov;
    });
    get().showToast("Ракурс запомнен");
  },

  removeScene: (id) => {
    get().update((draft) => {
      const index = draft.scenes.findIndex((scene) => scene.id === id);
      if (index < 0) return;
      draft.scenes.splice(index, 1);
      if (draft.activeSceneId === id) {
        draft.activeSceneId = draft.scenes[Math.max(0, index - 1)]?.id ?? "";
      }
    });
    if (get().selectedHotspotId) set({ selectedHotspotId: null });
  },

  duplicateScene: async (id) => {
    const scene = get().project?.scenes.find((item) => item.id === id);
    if (!scene) return;
    const imageId = uid("img");
    const blob = await idb.getBlob(scene.imageId);
    const urls = { ...get().urls };
    if (blob) {
      await idb.putBlob(imageId, blob);
      urls[imageId] = URL.createObjectURL(blob);
    }
    const copy: Scene = {
      ...structuredClone(scene),
      id: uid("scn"),
      name: `${scene.name} · копия`,
      imageId,
      hotspots: scene.hotspots.map((hotspot) => ({ ...hotspot, id: uid("hs") })),
    };
    set({ urls });
    get().update((draft) => {
      const index = draft.scenes.findIndex((item) => item.id === id);
      draft.scenes.splice(index + 1, 0, copy);
      draft.activeSceneId = copy.id;
    });
  },

  reorderScenes: (fromId, toId) => {
    if (fromId === toId) return;
    get().update((draft) => {
      const from = draft.scenes.findIndex((scene) => scene.id === fromId);
      const to = draft.scenes.findIndex((scene) => scene.id === toId);
      if (from < 0 || to < 0) return;
      const [item] = draft.scenes.splice(from, 1);
      draft.scenes.splice(to, 0, item);
    });
  },

  removeHotspot: (id) => {
    get().update((draft) => {
      for (const scene of draft.scenes) {
        scene.hotspots = scene.hotspots.filter((hotspot) => hotspot.id !== id);
      }
    });
    if (get().selectedHotspotId === id) set({ selectedHotspotId: null });
  },

  setLogo: async (file) => {
    const project = get().project;
    if (!project) return;
    const urls = { ...get().urls };
    if (!file) {
      get().update((draft) => {
        draft.settings.logoId = "";
      });
      return;
    }
    const id = project.settings.logoId || uid("logo");
    await idb.putBlob(id, file);
    if (urls[id]) URL.revokeObjectURL(urls[id]);
    urls[id] = URL.createObjectURL(file);
    set({ urls });
    get().update((draft) => {
      draft.settings.logoId = id;
    }, "skip");
  },

  setAudio: async (file) => {
    const project = get().project;
    if (!project) return;
    const urls = { ...get().urls };
    if (!file) {
      get().update((draft) => {
        draft.settings.audioId = "";
        draft.settings.audioName = "";
      });
      return;
    }
    const id = project.settings.audioId || uid("aud");
    await idb.putBlob(id, file);
    if (urls[id]) URL.revokeObjectURL(urls[id]);
    urls[id] = URL.createObjectURL(file);
    set({ urls });
    get().update((draft) => {
      draft.settings.audioId = id;
      draft.settings.audioName = file.name;
      draft.settings.soundEnabled = true;
    }, "skip");
    get().showToast("Звук подключён");
  },

  applyPreset: (id) => {
    const preset = PRESETS.find((item) => item.id === id);
    if (!preset) return;
    get().update((draft) => {
      draft.theme.preset = preset.id;
      draft.theme.accent = preset.accent;
      draft.theme.panel = preset.panel;
      draft.theme.text = preset.text;
      draft.theme.point = preset.point;
    }, "coalesce", "preset");
  },

  newProject: async (name, demo) => {
    revokeUrls(get().urls);
    if (demo) {
      const bundle = await createDemoBundle();
      bundle.project.name = name || "Демо-тур";
      await persistBundle(bundle.project, bundle.blobs);
      const urls = await hydrate(bundle.project);
      set({
        project: bundle.project,
        urls,
        history: [],
        future: [],
        projects: upsertSummary(get().projects, bundle.project),
        selectedHotspotId: null,
        placeKind: null,
        mode: "edit",
        dialog: null,
      });
      return;
    }
    const project = emptyProject(name);
    await idb.saveProject(project);
    await idb.setMeta({ lastId: project.id });
    set({
      project,
      urls: {},
      history: [],
      future: [],
      projects: upsertSummary(get().projects, project),
      selectedHotspotId: null,
      placeKind: null,
      mode: "edit",
      dialog: null,
    });
  },

  openProject: async (id) => {
    const project = await idb.getProject(id);
    if (!project) return;
    revokeUrls(get().urls);
    const urls = await hydrate(project);
    await idb.setMeta({ lastId: id });
    set({
      project,
      urls,
      history: [],
      future: [],
      selectedHotspotId: null,
      placeKind: null,
      mode: "edit",
      dialog: null,
    });
  },

  deleteProject: async (id) => {
    const doomed = await idb.getProject(id);
    await idb.deleteProjectRecord(id);
    if (doomed) {
      const rest = await idb.allProjects();
      const used = new Set<string>();
      for (const item of rest) {
        for (const scene of item.scenes) if (scene.imageId) used.add(scene.imageId);
        if (item.settings.logoId) used.add(item.settings.logoId);
        if (item.settings.audioId) used.add(item.settings.audioId);
      }
      const mine = new Set<string>();
      for (const scene of doomed.scenes) if (scene.imageId) mine.add(scene.imageId);
      if (doomed.settings.logoId) mine.add(doomed.settings.logoId);
      if (doomed.settings.audioId) mine.add(doomed.settings.audioId);
      for (const blobId of mine) {
        if (!used.has(blobId)) await idb.deleteBlob(blobId);
      }
    }
    let projects = get().projects.filter((item) => item.id !== id);
    if (get().project?.id !== id) {
      set({ projects });
      return;
    }
    revokeUrls(get().urls);
    if (projects.length === 0) {
      const project = emptyProject("Новый тур");
      await idb.saveProject(project);
      await idb.setMeta({ lastId: project.id });
      projects = [summary(project)];
      set({ projects, project, urls: {}, history: [], future: [], dialog: null });
      return;
    }
    await get().openProject(projects[0].id);
    set({ projects });
  },

  duplicateProject: async () => {
    const project = get().project;
    if (!project) return;
    const copy = structuredClone(project);
    copy.id = uid("prj");
    copy.name = `${project.name} · копия`;
    copy.updatedAt = Date.now();
    const idMap = new Map<string, string>();
    const take = async (oldId: string) => {
      if (!oldId) return "";
      const known = idMap.get(oldId);
      if (known) return known;
      const blob = await idb.getBlob(oldId);
      const nextId = uid("blob");
      idMap.set(oldId, nextId);
      if (blob) await idb.putBlob(nextId, blob);
      return nextId;
    };
    for (const scene of copy.scenes) scene.imageId = await take(scene.imageId);
    copy.settings.logoId = await take(copy.settings.logoId);
    copy.settings.audioId = await take(copy.settings.audioId);
    await idb.saveProject(copy);
    await idb.setMeta({ lastId: copy.id });
    revokeUrls(get().urls);
    const urls = await hydrate(copy);
    set({
      project: copy,
      urls,
      history: [],
      future: [],
      projects: upsertSummary(get().projects, copy),
      dialog: null,
    });
    get().showToast("Копия проекта создана");
  },

  exportProjectFile: async () => {
    const project = get().project;
    if (!project) return;
    set({ busy: "Собираем файл проекта…" });
    try {
      const { exportProjectZip } = await import("./export-project");
      await exportProjectZip(project);
      get().showToast("Файл проекта скачан");
    } catch (error) {
      get().showToast(error instanceof Error ? error.message : "Не удалось сохранить проект");
    } finally {
      set({ busy: null });
    }
  },

  importProjectFile: async (file) => {
    set({ busy: "Открываем проект…" });
    try {
      const { importProjectZip } = await import("./export-project");
      const project = await importProjectZip(file);
      revokeUrls(get().urls);
      const urls = await hydrate(project);
      await idb.setMeta({ lastId: project.id });
      set({
        project,
        urls,
        history: [],
        future: [],
        projects: upsertSummary(get().projects, project),
        dialog: null,
        selectedHotspotId: null,
        busy: null,
      });
      get().showToast("Проект открыт");
    } catch (error) {
      set({ busy: null });
      get().showToast(error instanceof Error ? error.message : "Не удалось открыть файл");
    }
  },

  exportSite: async (quality) => {
    const { project, urls } = get();
    if (!project) return;
    if (project.scenes.length === 0 || project.scenes.some((scene) => !urls[scene.imageId])) {
      get().showToast("Сначала добавьте фото во все сцены");
      return;
    }
    set({ busy: "Собираем сайт…", dialog: null });
    try {
      const { exportSiteZip } = await import("./export-site");
      await exportSiteZip(project, quality);
      get().showToast("Сайт скачан — ZIP можно залить на GitHub Pages");
    } catch (error) {
      get().showToast(error instanceof Error ? error.message : "Не удалось собрать сайт");
    } finally {
      set({ busy: null });
    }
  },
}));

if (typeof window !== "undefined") {
  window.addEventListener("beforeunload", () => {
    const project = useTour.getState().project;
    if (project) void idb.saveProject(project);
  });
}
