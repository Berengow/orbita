import type { PlayerTour, Project } from "./types";

export function toPlayerTour(
  project: Project,
  urls: Record<string, string>,
  ui: { mode: "edit" | "play"; placeKind: PlayerTour["placeKind"]; selectedHotspotId: string | null },
): PlayerTour {
  const s = project.settings;
  return {
    title: project.name,
    mode: ui.mode,
    activeSceneId: project.activeSceneId,
    placeKind: ui.placeKind,
    selectedHotspotId: ui.selectedHotspotId,
    theme: project.theme,
    settings: {
      soundEnabled: s.soundEnabled,
      autorotate: s.autorotate,
      autorotateSpeed: s.autorotateSpeed,
      gyro: s.gyro,
      minHfov: s.minHfov,
      maxHfov: s.maxHfov,
      carouselPlacement: s.carouselPlacement,
      logoPlacement: s.logoPlacement,
      logoText: s.logoText,
      aboutTitle: s.aboutTitle,
      aboutBody: s.aboutBody,
      introTitle: s.introTitle,
      introSubtitle: s.introSubtitle,
      introButton: s.introButton,
      northOffset: s.northOffset,
    },
    scenes: project.scenes.map((scene) => ({
      id: scene.id,
      name: scene.name,
      description: scene.description,
      image: urls[scene.imageId] ?? "",
      yaw: scene.yaw,
      pitch: scene.pitch,
      hfov: scene.hfov,
      mapX: scene.mapX,
      mapY: scene.mapY,
      modules: scene.modules,
      hotspots: scene.hotspots.map((h) => ({
        id: h.id,
        kind: h.kind,
        yaw: h.yaw,
        pitch: h.pitch,
        title: h.title,
        text: h.text,
        targetSceneId: h.targetSceneId,
        url: h.url,
      })),
    })),
    logoUrl: s.logoId ? (urls[s.logoId] ?? "") : "",
    audioUrl: s.audioId ? (urls[s.audioId] ?? "") : "",
  };
}
