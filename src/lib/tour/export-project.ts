import * as idb from "./idb";
import { slugify, uid } from "./presets";
import type { Project } from "./types";
import { downloadBlob } from "./download";

export async function exportProjectZip(project: Project): Promise<void> {
  const { default: JSZip } = await import("jszip");
  const zip = new JSZip();
  zip.file("project.json", JSON.stringify(project));
  const ids = new Set<string>();
  for (const scene of project.scenes) if (scene.imageId) ids.add(scene.imageId);
  if (project.settings.logoId) ids.add(project.settings.logoId);
  if (project.settings.audioId) ids.add(project.settings.audioId);
  for (const id of ids) {
    const blob = await idb.getBlob(id);
    if (blob) zip.file(`blobs/${id}`, blob);
  }
  const out = await zip.generateAsync({ type: "blob" });
  downloadBlob(out, `${slugify(project.name)}.orbita.zip`);
}

export async function importProjectZip(file: File): Promise<Project> {
  const { default: JSZip } = await import("jszip");
  const zip = await JSZip.loadAsync(file);
  const entry = zip.file("project.json");
  if (!entry) throw new Error("В архиве нет project.json — это не файл проекта ORBITA");
  const raw = JSON.parse(await entry.async("string")) as Project;
  if (!raw || raw.version !== 1 || !Array.isArray(raw.scenes)) {
    throw new Error("Файл проекта повреждён или из другой версии");
  }
  raw.id = uid("prj");
  raw.updatedAt = Date.now();
  const folder = zip.folder("blobs");
  if (folder) {
    const jobs: Promise<void>[] = [];
    folder.forEach((name, item) => {
      if (item.dir) return;
      jobs.push(
        item.async("blob").then((blob) => {
          const id = name.replace(/^blobs\//, "");
          return idb.putBlob(id, blob);
        }),
      );
    });
    await Promise.all(jobs);
  }
  await idb.saveProject(raw);
  return raw;
}
