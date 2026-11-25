export type HotspotKind = "scene" | "info" | "link" | "image" | "video" | "audio";
export type HotspotIcon =
  | "auto"
  | "arrow"
  | "info"
  | "link"
  | "image"
  | "video"
  | "audio"
  | "pin"
  | "star"
  | "door"
  | "camera"
  | "play"
  | "map"
  | "doc"
  | "heart"
  | "compass"
  | "eye";
export type HotspotMotion = "none" | "pulse" | "bounce" | "glow" | "rotate";
export type HotspotSurface = "modal" | "panel" | "tooltip" | "direct";
export type PointShape = "circle" | "diamond" | "square";
export type NavStyle =
  | "strip"
  | "side"
  | "float"
  | "grid"
  | "radial"
  | "groups"
  | "search"
  | "minimal"
  | "sheet"
  | "hotspots";
export type SceneTransition = "fade" | "zoom" | "none";
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
  icon: HotspotIcon;
  /** "theme" follows the tour-wide motion. */
  motion: HotspotMotion | "theme";
  surface: HotspotSurface;
  /** When true, a note or media opens in a new browser tab. */
  openInNewTab: boolean;
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
  group: string;
  featured: boolean;
  /** Empty inherits the tour hotspot color. */
  pointColor: string;
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
  shadow: number;
  gap: number;
  hotspotMotion: HotspotMotion;
  customCss: string;
}

export interface Settings {
  soundEnabled: boolean;
  autorotate: boolean;
  autorotateSpeed: number;
  gyro: boolean;
  minHfov: number;
  maxHfov: number;
  nav: NavStyle;
  transition: SceneTransition;
  thumbSize: number;
  hideBrand: boolean;
  guide: boolean;
  guideSeconds: number;
  deepLink: boolean;
  startSceneId: string;
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
  icon: HotspotIcon;
  motion: HotspotMotion | "theme";
  surface: HotspotSurface;
  openInNewTab: boolean;
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
  group: string;
  featured: boolean;
  pointColor: string;
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
    nav: NavStyle;
    transition: SceneTransition;
    thumbSize: number;
    hideBrand: boolean;
    guide: boolean;
    guideSeconds: number;
    deepLink: boolean;
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
