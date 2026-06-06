import type {
  Prefs,
  Ritual,
  SessionResult,
  StoreExport,
  StoredSession,
} from './types.js';

/**
 * The single local store (design doc §8).
 *
 * - `sessions` is an **append-only** log in IndexedDB. Every insight is derived
 *   from it; there is no parallel stat path and records are never mutated.
 * - `prefs` and `rituals` are small objects in localStorage.
 * - The whole store round-trips to/from JSON for export/import.
 */
const DB_NAME = 'eventide';
const DB_VERSION = 1;
const SESSIONS_STORE = 'sessions';
const PREFS_KEY = 'eventide.prefs.v1';
const RITUALS_KEY = 'eventide.rituals.v1';
const RECORD_VERSION = 1;

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB unavailable'));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(SESSIONS_STORE)) {
        const store = db.createObjectStore(SESSIONS_STORE, { keyPath: 'id' });
        store.createIndex('startedAt', 'startedAt');
        store.createIndex('module', 'module');
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function tx<T>(
  db: IDBDatabase,
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = db.transaction(SESSIONS_STORE, mode);
    const req = fn(t.objectStore(SESSIONS_STORE));
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function makeId(seed: number): string {
  const rand = Math.floor(Math.random() * 1e9).toString(36);
  return `${seed.toString(36)}-${rand}`;
}

export class Store {
  private dbPromise: Promise<IDBDatabase> | null = null;

  private db(): Promise<IDBDatabase> {
    if (!this.dbPromise) this.dbPromise = openDb();
    return this.dbPromise;
  }

  /** Append a finished session. Returns the persisted record. */
  async addSession(result: SessionResult): Promise<StoredSession> {
    const record: StoredSession = {
      ...result,
      id: makeId(result.startedAt),
      v: RECORD_VERSION,
    };
    const db = await this.db();
    await tx(db, 'readwrite', (s) => s.add(record));
    return record;
  }

  /** All sessions, newest first. */
  async allSessions(): Promise<StoredSession[]> {
    const db = await this.db();
    const all = await tx<StoredSession[]>(db, 'readonly', (s) => s.getAll());
    return all.sort((a, b) => b.startedAt - a.startedAt);
  }

  async clearSessions(): Promise<void> {
    const db = await this.db();
    await tx(db, 'readwrite', (s) => s.clear());
  }

  // --- prefs (localStorage) ---

  getPrefs(): Prefs {
    return readJson<Prefs>(PREFS_KEY, {});
  }

  setPrefs(prefs: Prefs): void {
    writeJson(PREFS_KEY, prefs);
  }

  // --- rituals (localStorage) ---

  getRituals(): Ritual[] {
    return readJson<Ritual[]>(RITUALS_KEY, []);
  }

  setRituals(rituals: Ritual[]): void {
    writeJson(RITUALS_KEY, rituals);
  }

  // --- export / import (first-class, §8) ---

  async export(): Promise<StoreExport> {
    return {
      schema: 'eventide.store',
      v: RECORD_VERSION,
      exportedAt: Date.now(),
      sessions: await this.allSessions(),
      rituals: this.getRituals(),
      prefs: this.getPrefs(),
    };
  }

  async exportJson(): Promise<string> {
    return JSON.stringify(await this.export(), null, 2);
  }

  /**
   * Import a previously exported store. By default merges sessions (dedupe by
   * id); pass `{ replace: true }` to overwrite everything.
   */
  async import(data: StoreExport, opts: { replace?: boolean } = {}): Promise<void> {
    if (data.schema !== 'eventide.store') {
      throw new Error('Not an Eventide export');
    }
    const db = await this.db();
    if (opts.replace) await this.clearSessions();

    const existing = opts.replace
      ? new Set<string>()
      : new Set((await this.allSessions()).map((s) => s.id));

    for (const session of data.sessions) {
      if (existing.has(session.id)) continue;
      await tx(db, 'readwrite', (s) => s.put(session));
    }
    if (data.rituals) this.setRituals(data.rituals);
    if (data.prefs) this.setPrefs(data.prefs);
  }

  async importJson(json: string, opts?: { replace?: boolean }): Promise<void> {
    await this.import(JSON.parse(json) as StoreExport, opts);
  }
}

function readJson<T>(key: string, fallback: T): T {
  if (typeof localStorage === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota / private mode — ignore */
  }
}
