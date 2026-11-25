import { CircleHelp, Download, FolderOpen, Plus, Redo2, Undo2 } from "lucide-react";
import type { ReactNode } from "react";
import { useTour } from "@/lib/tour/store";
import { Mark } from "./controls";

export function TopBar() {
  const project = useTour((s) => s.project);
  const update = useTour((s) => s.update);
  const setDialog = useTour((s) => s.setDialog);
  const setMode = useTour((s) => s.setMode);
  const undo = useTour((s) => s.undo);
  const redo = useTour((s) => s.redo);
  const history = useTour((s) => s.history.length);
  const future = useTour((s) => s.future.length);
  const busy = useTour((s) => s.busy);
  if (!project) return null;

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b border-line px-2 sm:gap-3 sm:px-3">
      <Mark />
      <div className="min-w-0 flex-1">
        <p className="font-display text-sm tracking-wide">ORBITA</p>
        <input
          aria-label="Название тура"
          value={project.name}
          onChange={(event) => update((draft) => { draft.name = event.target.value; }, "coalesce", "project-name")}
          className="w-full min-w-0 truncate bg-transparent text-2xs text-muted outline-none"
        />
      </div>
      <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
        <span className="mr-2 hidden text-2xs text-faint sm:inline">{busy || "Черновик в браузере"}</span>
        <IconButton label="Отменить" disabled={!history} onClick={undo}><Undo2 className="size-4" /></IconButton>
        <IconButton label="Повторить" disabled={!future} onClick={redo}><Redo2 className="size-4" /></IconButton>
        <button type="button" onClick={() => setDialog("new")} className="inline-flex h-9 items-center gap-1 rounded-lg px-2 text-sm text-fg hover:bg-surface-2">
          <Plus className="size-4" />
          <span className="hidden sm:inline">Новый</span>
        </button>
        <button type="button" onClick={() => setDialog("projects")} className="inline-flex h-9 items-center gap-1 rounded-lg px-2 text-sm hover:bg-surface-2">
          <FolderOpen className="size-4" />
          <span className="hidden sm:inline">Проект</span>
        </button>
        <button type="button" aria-label="Справка" onClick={() => setDialog("help")} className="inline-flex h-9 items-center gap-1 rounded-lg px-2 text-sm text-muted hover:bg-surface-2">
          <CircleHelp className="size-4 md:hidden" />
          <span className="hidden md:inline">Справка</span>
        </button>
        <button type="button" onClick={() => setMode("play")} className="hidden h-9 rounded-lg border border-line px-3 text-sm sm:inline">
          Открыть
        </button>
        <button type="button" onClick={() => setDialog("export")} className="inline-flex h-9 items-center gap-1 rounded-lg bg-accent px-3 text-sm font-medium text-accent-ink">
          <Download className="size-4" />
          <span className="hidden sm:inline">Скачать сайт</span>
        </button>
      </div>
    </header>
  );
}

function IconButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button type="button" aria-label={label} disabled={disabled} onClick={onClick} className="grid size-9 place-items-center rounded-lg text-muted hover:bg-surface-2 hover:text-fg disabled:opacity-30">
      {children}
    </button>
  );
}
