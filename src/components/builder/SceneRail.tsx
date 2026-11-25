import { Copy, Plus, Trash2 } from "lucide-react";
import { plural } from "@/lib/tour/presets";
import { useTour } from "@/lib/tour/store";

export function SceneRail({ onAdd }: { onAdd: () => void }) {
  const project = useTour((s) => s.project);
  const urls = useTour((s) => s.urls);
  const setActive = useTour((s) => s.setActive);
  const reorder = useTour((s) => s.reorderScenes);
  const duplicate = useTour((s) => s.duplicateScene);
  const remove = useTour((s) => s.removeScene);
  if (!project) return null;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center justify-between px-3 py-3">
        <p className="text-2xs tracking-wide text-muted uppercase">
          Сцены {project.scenes.length ? project.scenes.length : ""}
        </p>
        <button
          type="button"
          onClick={onAdd}
          className="inline-flex h-9 items-center gap-1 rounded-lg bg-accent px-3 text-sm font-medium text-accent-ink"
        >
          <Plus className="size-4" />
          Добавить
        </button>
      </div>
      <div className="min-h-0 flex-1 space-y-1 overflow-auto px-2 pb-3">
        {project.scenes.length === 0 ? (
          <p className="px-2 py-6 text-sm text-pretty text-muted">
            Перетащите сюда равноугольные панорамы или нажмите «Добавить». Порядок можно менять мышью.
          </p>
        ) : null}
        {project.scenes.map((scene) => {
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
              className={`group flex items-center gap-2 rounded-xl border p-1.5 ${
                active ? "border-accent bg-surface-2" : "border-transparent hover:bg-surface-2"
              }`}
            >
              <button type="button" onClick={() => setActive(scene.id)} className="flex min-w-0 flex-1 items-center gap-2 text-left">
                <span className="pano-thumb size-12 shrink-0 rounded-lg">
                  {src ? <img src={src} alt="" /> : null}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm">{scene.name}</span>
                  <span className="block text-2xs text-faint">
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
