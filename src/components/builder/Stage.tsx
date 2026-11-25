import { useEffect, useRef, useState } from "react";
import { publicAsset } from "@/lib/tour/public-asset";
import { toPlayerTour } from "@/lib/tour/payload";
import { useTour } from "@/lib/tour/store";
import type { HotspotKind } from "@/lib/tour/types";

interface PlayerMessage {
  source?: string;
  type?: string;
  id?: string;
  kind?: HotspotKind | null;
  yaw?: number;
  pitch?: number;
  hfov?: number;
  x?: number;
  y?: number;
  sceneId?: string;
}

export function Stage() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const ready = useRef(false);
  const [src, setSrc] = useState("");
  const project = useTour((s) => s.project);
  const placeKind = useTour((s) => s.placeKind);
  const view = useTour((s) => s.view);
  const setPlace = useTour((s) => s.setPlace);
  const rememberView = useTour((s) => s.rememberView);

  useEffect(() => {
    setSrc(`${publicAsset("player/index.html")}?embed=1`);
  }, []);

  useEffect(() => {
    const postTour = () => {
      const frame = iframeRef.current?.contentWindow;
      const state = useTour.getState();
      if (!frame || !state.project) return;
      const tour = toPlayerTour(state.project, state.urls, {
        mode: state.mode,
        placeKind: state.placeKind,
        selectedHotspotId: state.selectedHotspotId,
      });
      frame.postMessage({ source: "orbita-builder", type: "tour", tour }, window.location.origin);
    };

    const onMessage = (event: MessageEvent<PlayerMessage>) => {
      if (event.origin !== window.location.origin) return;
      const data = event.data;
      if (!data || data.source !== "orbita-player") return;
      const api = useTour.getState();
      if (data.type === "ready") {
        ready.current = true;
        postTour();
      } else if (data.type === "scene" && data.id) api.setActive(data.id);
      else if (data.type === "select" && data.id) api.setSelected(data.id);
      else if (data.type === "place" && data.kind && typeof data.yaw === "number" && typeof data.pitch === "number") {
        api.addHotspot({ kind: data.kind, yaw: data.yaw, pitch: data.pitch });
      } else if (data.type === "move" && data.id && typeof data.yaw === "number" && typeof data.pitch === "number") {
        api.moveHotspot(data.id, data.yaw, data.pitch);
      } else if (data.type === "map" && data.id && typeof data.x === "number" && typeof data.y === "number") {
        api.moveMap(data.id, data.x, data.y);
      } else if (data.type === "place-arm") api.setPlace(data.kind ?? null);
      else if (data.type === "view" && typeof data.yaw === "number" && typeof data.pitch === "number" && typeof data.hfov === "number") {
        api.setView({ yaw: data.yaw, pitch: data.pitch, hfov: data.hfov });
      } else if (data.type === "view-commit" && typeof data.yaw === "number" && typeof data.pitch === "number" && typeof data.hfov === "number") {
        api.rememberView({ yaw: data.yaw, pitch: data.pitch, hfov: data.hfov });
      }
    };

    let last = "";
    const unsub = useTour.subscribe(() => {
      if (!ready.current) return;
      const state = useTour.getState();
      if (!state.project) return;
      const tour = toPlayerTour(state.project, state.urls, {
        mode: state.mode,
        placeKind: state.placeKind,
        selectedHotspotId: state.selectedHotspotId,
      });
      const key = JSON.stringify({ ...tour, activeSceneId: "" });
      if (key === last) return;
      last = key;
      iframeRef.current?.contentWindow?.postMessage(
        { source: "orbita-builder", type: "tour", tour },
        window.location.origin,
      );
    });
    window.addEventListener("message", onMessage);
    return () => {
      window.removeEventListener("message", onMessage);
      unsub();
    };
  }, []);

  const remember = () => {
    iframeRef.current?.contentWindow?.postMessage(
      { source: "orbita-builder", type: "remember" },
      window.location.origin,
    );
  };

  const yaw = Math.round(view.yaw);
  const hasScene = Boolean(project?.activeSceneId);

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-bg">
      <div className="relative min-h-0 flex-1">
        {src ? (
          <iframe
            ref={iframeRef}
            title="Предпросмотр тура"
            src={src}
            className="h-full w-full border-0"
            allow="fullscreen; gyroscope"
            onLoad={() => {
            ready.current = true;
            const state = useTour.getState();
            if (!state.project || !iframeRef.current?.contentWindow) return;
            const tour = toPlayerTour(state.project, state.urls, {
              mode: state.mode,
              placeKind: state.placeKind,
              selectedHotspotId: state.selectedHotspotId,
            });
            iframeRef.current.contentWindow.postMessage(
              { source: "orbita-builder", type: "tour", tour },
              window.location.origin,
            );
          }}
        />
        ) : null}
      </div>
      <div className="flex h-11 shrink-0 items-center gap-3 overflow-hidden border-t border-line px-3 text-xs sm:gap-4 sm:px-4 sm:text-sm">
        <button
          type="button"
          className={placeKind ? "text-accent" : "text-fg"}
          onClick={() => setPlace(placeKind === "scene" ? null : "scene")}
        >
          Поставить точку
        </button>
        <button type="button" className="text-muted disabled:opacity-40" disabled={!hasScene} onClick={remember}>
          Запомнить ракурс
        </button>
        <span className="tabular-nums text-faint">yaw {yaw > 0 ? "+" : ""}{yaw}°</span>
      </div>
    </div>
  );
}
