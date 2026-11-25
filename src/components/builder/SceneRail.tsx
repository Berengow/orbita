import { Copy, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { plural } from "@/lib/tour/presets";
import { useTour } from "@/lib/tour/store";
import { ViewThumb } from "./ViewThumb";

export function SceneRail({ onAdd }: { onAdd: () => void }) {
  const project = useTour((s) => s.project);
  const urls = useTour((s) => s.urls);
  const setActive = useTour((s) => s.setActive);
  const reorder = useTour((s) => s.reorderScenes);
  const duplicate = useTour((s) => s.duplicateScene);
  const remove = useTour((s) => s.removeScene);
  const [query, setQuery] = useState("");
  if (!project) return null;
  const needle = query.trim().toLowerCase();
  const scenes = needle
    ? project.scenes.filter((scene) => `${scene.name} ${scene.group} ${scene.description}`.toLowerCase().includes(needle))
    : project.scenes;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center justify-between px-3 py-3 border-b border-line">
        <p className="text-2xs tracking-wide text-muted uppercase">
          Сцены {project.scenes.length ? `· ${project.scenes.length}` : ""}
        </p>
        <button
          type="button"
          onClick={onAdd}
          className="inline-flex h-8 items-center gap-1 rounded-lg bg-accent px-2.5 text-xs font-medium text-accent-ink"
        >
          <Plus className="size-3.5" />
          Добавить
        </button>
      </div>
      <div className="px-3 py-2">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Поиск сцен"
          aria-label="Поиск сцен"
          className="h-8 w-full rounded-lg border border-line bg-bg px-2.5 text-xs outline-none placeholder:text-faint"
        />
      </div>
      <div className="min-h-0 flex-1 space-y-1 overflow-auto px-2 pb-3">
        {scenes.length === 0 ? (
          <p className="px-2 py-6 text-sm text-pretty text-muted">
            {project.scenes.length === 0
              ? "Перетащите сюда равноугольные панорамы или нажмите «Добавить». Порядок можно менять мышью."
              : "Ничего не найдено."}
          </p>
        ) : null}
        {scenes.map((scene) => {
          const active = scene.id === project.activeSceneId;
          const src = urls[scene.imageId];
          return (
            <div
              key={scene.id}
              draggable
              onDragStart={(event) => {
                event.dataTransfer.setData("text/plain", scene.id);
                event.dataTransfer.effectAllowed = "move";
              }}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                reorder(event.dataTransfer.getData("text/plain"), scene.id);
              }}
              className={`group relative flex items-center gap-2.5 rounded-2xl border p-1.5 transition-colors ${
                active
                  ? "border-accent/70 bg-accent/10 shadow-[inset_3px_0_0_var(--color-accent)]"
                  : "border-transparent hover:border-line hover:bg-surface-2"
              }`}
            >
              <button type="button" onClick={() => setActive(scene.id)} className="flex min-w-0 flex-1 items-center gap-2 text-left">
                <span className="pano-thumb size-14 shrink-0 overflow-hidden rounded-xl ring-1 ring-white/10">
                  {src || scene.thumbId ? (
                    <ViewThumb
                      src={scene.thumbId ? (urls[scene.thumbId] ?? "") : (src ?? "")}
                      yaw={scene.yaw}
                      pitch={scene.pitch}
                      hfov={scene.hfov}
                      custom={Boolean(scene.thumbId)}
                    />
                  ) : null}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm">{scene.featured ? "★ " : ""}{scene.name}</span>
                  <span className="block truncate text-2xs text-faint">
                    {scene.group ? `${scene.group} · ` : ""}
                    {plural(scene.hotspots.length, "точка", "точки", "точек")}
                  </span>
                </span>
              </button>
              <span className="flex shrink-0">
                <button type="button" className="grid size-9 place-items-center text-muted hover:text-fg" aria-label="Дублировать сцену" onClick={() => void duplicate(scene.id)}>
                  <Copy className="size-3.5" />
                </button>
                <button type="button" className="grid size-9 place-items-center text-muted hover:text-fg" aria-label="Удалить сцену" onClick={() => remove(scene.id)}>
                  <Trash2 className="size-3.5" />
                </button>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
