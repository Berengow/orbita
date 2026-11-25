export type HotspotKind = "scene" | "info" | "link";
export type PointShape = "circle" | "diamond" | "square";
export type CarouselPlacement = "bottom" | "left" | "right";
export type LogoPlacement = "top-left" | "top-center" | "top-right";
export type ExportQuality = "compact" | "balanced" | "high" | "original";

export interface Hotspot {
  id: string;
  kind: HotspotKind;
  yaw: number;
  pitch: number;
  title: string;
  text: string;
  targetSceneId: string;
  url: string;
}

export interface SceneModules {
  carousel: boolean;
  logo: boolean;
  about: boolean;
  hotspots: boolean;
  labels: boolean;
  minimap: boolean;
  infoCard: boolean;
  compass: boolean;
  sceneTitle: boolean;
  arrows: boolean;
  fullscreen: boolean;
  loader: boolean;
  intro: boolean;
}

export interface Scene {
  id: string;
  name: string;
  description: string;
  imageId: string;
  yaw: number;
  pitch: number;
  hfov: number;
  mapX: number;
  mapY: number;
  hotspots: Hotspot[];
  modules: SceneModules;
}

export interface Theme {
  preset: string;
  accent: string;
  panel: string;
  text: string;
  point: string;
  font: string;
  radius: number;
  opacity: number;
  blur: number;
  pointScale: number;
  pointShape: PointShape;
  uiScale: number;
}

export interface Settings {
  soundEnabled: boolean;
  autorotate: boolean;
  autorotateSpeed: number;
  gyro: boolean;
  minHfov: number;
  maxHfov: number;
  carouselPlacement: CarouselPlacement;
  logoPlacement: LogoPlacement;
  logoText: string;
  logoId: string;
  aboutTitle: string;
  aboutBody: string;
  audioId: string;
  audioName: string;
  introTitle: string;
  introSubtitle: string;
  introButton: string;
  northOffset: number;
}

export interface Project {
  version: 1;
  id: string;
  name: string;
  updatedAt: number;
  theme: Theme;
  settings: Settings;
  scenes: Scene[];
  activeSceneId: string;
}

export interface ProjectSummary {
  id: string;
  name: string;
  updatedAt: number;
  sceneCount: number;
}

export interface PlayerHotspot {
  id: string;
  kind: HotspotKind;
  yaw: number;
  pitch: number;
  title: string;
  text: string;
  targetSceneId: string;
  url: string;
}

export interface PlayerScene {
  id: string;
  name: string;
  description: string;
  image: string;
  yaw: number;
  pitch: number;
  hfov: number;
  mapX: number;
  mapY: number;
  modules: SceneModules;
  hotspots: PlayerHotspot[];
}

export interface PlayerTour {
  title: string;
  mode: "edit" | "play";
  activeSceneId: string;
  placeKind: HotspotKind | null;
  selectedHotspotId: string | null;
  theme: Theme;
  settings: {
    soundEnabled: boolean;
    autorotate: boolean;
    autorotateSpeed: number;
    gyro: boolean;
    minHfov: number;
    maxHfov: number;
    carouselPlacement: CarouselPlacement;
    logoPlacement: LogoPlacement;
    logoText: string;
    aboutTitle: string;
    aboutBody: string;
    introTitle: string;
    introSubtitle: string;
    introButton: string;
    northOffset: number;
  };
  scenes: PlayerScene[];
  logoUrl: string;
  audioUrl: string;
}
