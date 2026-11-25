import type { Project, ProjectSummary } from "./types";

const DB_NAME = "orbita";
const DB_VERSION = 1;

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains("projects")) db.createObjectStore("projects");
      if (!db.objectStoreNames.contains("blobs")) db.createObjectStore("blobs");
      if (!db.objectStoreNames.contains("meta")) db.createObjectStore("meta");
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error("IndexedDB"));
  });
}

function request<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error("idb"));
  });
}

export async function saveProject(project: Project): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction("projects", "readwrite");
    tx.objectStore("projects").put(project, project.id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error("save"));
  });
}

export async function getProject(id: string): Promise<Project | null> {
  const db = await openDb();
  const tx = db.transaction("projects", "readonly");
  const result = await request(tx.objectStore("projects").get(id) as IDBRequest<Project | undefined>);
  return result ?? null;
}

export async function deleteProjectRecord(id: string): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction("projects", "readwrite");
    tx.objectStore("projects").delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error("delete"));
  });
}

export async function listProjects(): Promise<ProjectSummary[]> {
  const db = await openDb();
  const tx = db.transaction("projects", "readonly");
  const all = await request(tx.objectStore("projects").getAll() as IDBRequest<Project[]>);
  return all
    .map((p) => ({
      id: p.id,
      name: p.name,
      updatedAt: p.updatedAt,
      sceneCount: p.scenes.length,
    }))
    .sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function putBlob(id: string, blob: Blob): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction("blobs", "readwrite");
    tx.objectStore("blobs").put(blob, id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error("blob"));
  });
}

export async function deleteBlob(id: string): Promise<void> {
  if (!id) return;
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction("blobs", "readwrite");
    tx.objectStore("blobs").delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error("blob"));
  });
}

export async function allProjects(): Promise<Project[]> {
  const db = await openDb();
  const tx = db.transaction("projects", "readonly");
  return request(tx.objectStore("projects").getAll() as IDBRequest<Project[]>);
}

export async function getBlob(id: string): Promise<Blob | null> {
  if (!id) return null;
  const db = await openDb();
  const tx = db.transaction("blobs", "readonly");
  const result = await request(tx.objectStore("blobs").get(id) as IDBRequest<Blob | undefined>);
  return result ?? null;
}

export async function getMeta(): Promise<{ lastId: string }> {
  const db = await openDb();
  const tx = db.transaction("meta", "readonly");
  const result = await request(
    tx.objectStore("meta").get("last") as IDBRequest<{ lastId: string } | undefined>,
  );
  return result ?? { lastId: "" };
}

export async function setMeta(meta: { lastId: string }): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction("meta", "readwrite");
    tx.objectStore("meta").put(meta, "last");
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error("meta"));
  });
}
