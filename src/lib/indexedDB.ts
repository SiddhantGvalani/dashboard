// IndexedDB — cache only (project CRUD moved to Zite Database via API)
import { projectsGet, projectSave, projectDelete } from 'zite-endpoints-sdk';

const DB_NAME = 'bombax_logistics';
const DB_VERSION = 2;
const CACHE_TTL = 5 * 60 * 1000;

export interface Project {
  id: string;
  name: string;
  sheetId: string;
  sheetName: string;
  serviceAccountJson: string;
  startRow?: number;
  createdAt: number;
}

interface CacheEntry {
  key: string;
  data: Record<string, string>[];
  columns: string[];
  timestamp: number;
}

// ─── Project CRUD (Zite Database via API) ────────────────────────────────────

export async function getProjects(): Promise<Project[]> {
  const result = await projectsGet({});
  return result.projects as Project[];
}

export async function saveProject(project: Project): Promise<void> {
  await projectSave({
    id: project.id || undefined,
    name: project.name,
    sheetId: project.sheetId,
    sheetName: project.sheetName,
    serviceAccountJson: project.serviceAccountJson,
    startRow: project.startRow ?? 2,
  });
}

export async function deleteProject(id: string): Promise<void> {
  await projectDelete({ id });
}

// ─── IndexedDB cache (unchanged) ─────────────────────────────────────────────

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('cache')) {
        db.createObjectStore('cache', { keyPath: 'key' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function getCacheData(key: string): Promise<{ data: Record<string, string>[]; columns: string[] } | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const req = db.transaction('cache', 'readonly').objectStore('cache').get(key);
    req.onsuccess = () => {
      const entry: CacheEntry | undefined = req.result;
      if (!entry || Date.now() - entry.timestamp > CACHE_TTL) return resolve(null);
      resolve({ data: entry.data, columns: entry.columns });
    };
    req.onerror = () => reject(req.error);
  });
}

export async function setCacheData(key: string, data: Record<string, string>[], columns: string[]): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const entry: CacheEntry = { key, data, columns, timestamp: Date.now() };
    const req = db.transaction('cache', 'readwrite').objectStore('cache').put(entry);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function clearAllCache(): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const req = db.transaction('cache', 'readwrite').objectStore('cache').clear();
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}
