import { useEffect, useRef, useState } from "react";
import { useTour } from "@/lib/tour/store";
import type { ExportQuality } from "@/lib/tour/types";
import { Dialog, Mark, fieldClass } from "./controls";
import { SceneRail } from "./SceneRail";
import { Settings } from "./Settings";
import { Stage } from "./Stage";
import { TopBar } from "./TopBar";

export function Builder() {
  const booted = useTour((s) => s.booted);
  const bootError = useTour((s) => s.bootError);
  const boot = useTour((s) => s.boot);
  const project = useTour((s) => s.project);

  useEffect(() => {
    void boot();
  }, [boot]);

  if (!booted) return <Boot label="Открываем тур" />;
  if (!project) return <Boot label={bootError || "Черновик не открылся"} />;
  return <Shell />;
}

function Boot({ label }: { label: string }) {
  return (
    <main className="grid h-dvh place-items-center bg-bg px-6 text-center text-fg">
      <div>
        <Mark className="mx-auto size-12" />
        <p className="mt-4 font-display text-xl tracking-wide">ORBITA</p>
        <p className="mt-2 text-sm text-muted">{label}</p>
      </div>
    </main>
  );
}

function Shell() {
  const mode = useTour((s) => s.mode);
  const setMode = useTour((s) => s.setMode);
  const mobilePane = useTour((s) => s.mobilePane);
  const setMobile = useTour((s) => s.setMobile);
  const dialog = useTour((s) => s.dialog);
  const setDialog = useTour((s) => s.setDialog);
  const toast = useTour((s) => s.toast);
  const dragging = useTour((s) => s.draggingFiles);
  const setDragging = useTour((s) => s.setDragging);
  const addFiles = useTour((s) => s.addFiles);
  const setPlace = useTour((s) => s.setPlace);
  const placeKind = useTour((s) => s.placeKind);
  const undo = useTour((s) => s.undo);
  const redo = useTour((s) => s.redo);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const hasFiles = (event: DragEvent) => Array.from(event.dataTransfer?.types ?? []).includes("Files");
    const onOver = (event: DragEvent) => {
      if (!hasFiles(event)) return;
      event.preventDefault();
      setDragging(true);
    };
    const onDrop = (event: DragEvent) => {
      if (!hasFiles(event)) return;
      event.preventDefault();
      const images = Array.from(event.dataTransfer?.files ?? []).filter((file) => file.type.startsWith("image/"));
      setDragging(false);
      if (images.length) void addFiles(images);
    };
    const onEnd = () => setDragging(false);
    window.addEventListener("dragover", onOver);
    window.addEventListener("drop", onDrop);
    window.addEventListener("dragend", onEnd);
    return () => {
      window.removeEventListener("dragover", onOver);
      window.removeEventListener("drop", onDrop);
      window.removeEventListener("dragend", onEnd);
    };
  }, [addFiles, setDragging]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing = target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT");
      if (event.key === "Escape") {
        if (dialog) setDialog(null);
        else if (placeKind) setPlace(null);
        else if (mode === "play") setMode("edit");
        else if (mobilePane) setMobile(null);
        return;
      }
      if (typing) return;
      const meta = event.metaKey || event.ctrlKey;
      if (meta && event.key.toLowerCase() === "z") {
        event.preventDefault();
        if (event.shiftKey) redo();
        else undo();
      }
      if (meta && event.key.toLowerCase() === "y") {
        event.preventDefault();
        redo();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [dialog, placeKind, mode, mobilePane, setDialog, setPlace, setMode, setMobile, undo, redo]);

  return (
    <main className="relative flex h-dvh flex-col overflow-hidden bg-bg text-fg">
      {mode === "edit" ? <TopBar /> : null}
      <div className="relative flex min-h-0 flex-1">
        {mode === "edit" ? (
          <aside className="hidden w-rail shrink-0 border-r border-line bg-surface lg:block">
            <SceneRail onAdd={() => fileRef.current?.click()} />
          </aside>
        ) : null}
        <Stage />
        {mode === "edit" ? (
          <aside className="hidden w-inspector shrink-0 border-l border-line bg-surface lg:block">
            <Settings />
          </aside>
        ) : null}
        {mode === "play" ? (
          <button type="button" onClick={() => setMode("edit")} className="absolute top-3 left-3 z-10 h-10 rounded-full bg-surface px-4 text-sm text-fg">
            В редактор
          </button>
        ) : null}
        {mode === "edit" && mobilePane ? (
          <div className="absolute inset-0 z-20 overflow-auto bg-surface lg:hidden">
            {mobilePane === "scenes" ? <SceneRail onAdd={() => fileRef.current?.click()} /> : <Settings />}
          </div>
        ) : null}
        {dragging ? (
          <div className="absolute inset-0 z-30 grid place-items-center bg-bg/80 text-center">
            <p className="font-display text-2xl">Отпустите панорамы</p>
          </div>
        ) : null}
      </div>
      {mode === "edit" ? (
        <nav className="flex h-12 shrink-0 border-t border-line lg:hidden">
          <DockButton active={mobilePane === "scenes"} onClick={() => setMobile(mobilePane === "scenes" ? null : "scenes")}>Сцены</DockButton>
          <DockButton active={mobilePane === null} onClick={() => setMobile(null)}>Тур</DockButton>
          <DockButton active={mobilePane === "settings"} onClick={() => setMobile(mobilePane === "settings" ? null : "settings")}>Настройки</DockButton>
        </nav>
      ) : null}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(event) => {
          const files = Array.from(event.target.files ?? []);
          if (files.length) void addFiles(files);
          event.target.value = "";
        }}
      />
      {dialog ? <Overlays /> : null}
      {toast ? (
        <div className="pointer-events-none fixed bottom-16 left-1/2 z-50 -translate-x-1/2 rounded-full bg-fg px-4 py-2 text-sm text-bg">
          {toast}
        </div>
      ) : null}
    </main>
  );
}

function DockButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: string }) {
  return (
    <button type="button" onClick={onClick} className={`flex-1 text-sm ${active ? "text-fg" : "text-muted"}`}>
      {children}
    </button>
  );
}

function Overlays() {
  const dialog = useTour((s) => s.dialog);
  const setDialog = useTour((s) => s.setDialog);
  const close = () => setDialog(null);
  if (dialog === "new") return <NewDialog onClose={close} />;
  if (dialog === "export") return <ExportDialog onClose={close} />;
  if (dialog === "projects") return <ProjectsDialog onClose={close} />;
  if (dialog === "help") return <HelpDialog onClose={close} />;
  return null;
}

function NewDialog({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState("Новый тур");
  const create = useTour((s) => s.newProject);
  return (
    <Dialog title="Новый тур" onClose={onClose}>
      <label className="mb-4 block text-sm">
        Название
        <input className={`${fieldClass} mt-1`} value={name} onChange={(event) => setName(event.target.value)} />
      </label>
      <div className="flex gap-2">
        <button type="button" className="h-11 flex-1 rounded-lg bg-accent text-sm font-medium text-accent-ink" onClick={() => void create(name, false)}>Пустой</button>
        <button type="button" className="h-11 flex-1 rounded-lg border border-line text-sm" onClick={() => void create(name, true)}>С демо-залами</button>
      </div>
    </Dialog>
  );
}

function ExportDialog({ onClose }: { onClose: () => void }) {
  const [quality, setQuality] = useState<ExportQuality>("balanced");
  const exportSite = useTour((s) => s.exportSite);
  const options: { id: ExportQuality; title: string; text: string }[] = [
    { id: "compact", title: "Компакт", text: "до 1600 px — легче на телефоне" },
    { id: "balanced", title: "Баланс", text: "до 2560 px — обычно лучший выбор" },
    { id: "high", title: "Высокое", text: "до 4096 px" },
    { id: "original", title: "Как есть", text: "без пережатия" },
  ];
  return (
    <Dialog title="Скачать сайт" onClose={onClose}>
      <p className="mb-3 text-sm text-pretty text-muted">ZIP с index.html, панорамами и плеером. База и сервер не нужны — залейте папку на любой хостинг.</p>
      <div className="space-y-2">
        {options.map((option) => (
          <label key={option.id} className="flex cursor-pointer items-start gap-3 rounded-lg border border-line px-3 py-2">
            <input type="radio" name="quality" checked={quality === option.id} onChange={() => setQuality(option.id)} className="mt-1" />
            <span>
              <span className="block text-sm">{option.title}</span>
              <span className="block text-2xs text-faint">{option.text}</span>
            </span>
          </label>
        ))}
      </div>
      <button type="button" className="mt-4 h-11 w-full rounded-lg bg-accent text-sm font-medium text-accent-ink" onClick={() => void exportSite(quality)}>
        Собрать ZIP
      </button>
    </Dialog>
  );
}

function ProjectsDialog({ onClose }: { onClose: () => void }) {
  const projects = useTour((s) => s.projects);
  const currentId = useTour((s) => s.project?.id);
  const openProject = useTour((s) => s.openProject);
  const deleteProject = useTour((s) => s.deleteProject);
  const duplicateProject = useTour((s) => s.duplicateProject);
  const exportProjectFile = useTour((s) => s.exportProjectFile);
  const importProjectFile = useTour((s) => s.importProjectFile);
  return (
    <Dialog title="Проект" onClose={onClose}>
      <div className="mb-3 flex flex-wrap gap-2">
        <button type="button" className="h-10 rounded-lg border border-line px-3 text-sm" onClick={() => void exportProjectFile()}>Скачать проект</button>
        <label className="inline-flex h-10 cursor-pointer items-center rounded-lg border border-line px-3 text-sm">
          Открыть файл
          <input type="file" accept=".zip,application/zip" className="hidden" onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void importProjectFile(file);
            event.target.value = "";
          }} />
        </label>
        <button type="button" className="h-10 rounded-lg border border-line px-3 text-sm" onClick={() => void duplicateProject()}>Дублировать</button>
      </div>
      <ul className="space-y-1">
        {projects.map((item) => (
          <li key={item.id} className="flex items-center gap-2 rounded-lg px-2 py-1 hover:bg-surface-2">
            <button type="button" className="min-w-0 flex-1 py-2 text-left" onClick={() => void openProject(item.id)}>
              <span className="block truncate text-sm">{item.name}</span>
              <span className="block text-2xs text-faint">{item.sceneCount} сцен{item.id === currentId ? " · открыт" : ""}</span>
            </button>
            <button type="button" className="text-2xs text-muted" onClick={() => void deleteProject(item.id)}>Удалить</button>
          </li>
        ))}
      </ul>
    </Dialog>
  );
}

function HelpDialog({ onClose }: { onClose: () => void }) {
  const steps = [
    ["1. Сцены", "«Добавить» или перетащите несколько фото 360°. Имена берутся из файлов, порядок меняется перетаскиванием."],
    ["2. Точки", "Выберите переход, заметку или ссылку и кликните по залу. Точку можно перетащить. Подпись и цель правятся справа."],
    ["3. Ракурс", "Поверните панораму и нажмите «Запомнить ракурс» — так тур откроется у зрителя."],
    ["4. Вид", "Темы, цвета, шрифт, плотность, размытие и модули применяются сразу. У каждой сцены свой набор модулей."],
    ["5. Сайт", "«Скачать сайт» собирает ZIP с относительными путями. Его можно положить на GitHub Pages — и в корень user.github.io, и в подпапку проекта. Сервер не нужен."],
    ["6. Проект", "Черновик хранится в браузере. Файл проекта скачивается и открывается на другом компьютере."],
  ];
  return (
    <Dialog title="Как собрать тур" onClose={onClose}>
      <ol className="space-y-3">
        {steps.map(([title, text]) => (
          <li key={title}>
            <p className="text-sm font-medium">{title}</p>
            <p className="text-sm text-pretty text-muted">{text}</p>
          </li>
        ))}
      </ol>
    </Dialog>
  );
}
