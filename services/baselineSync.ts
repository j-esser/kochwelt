import AsyncStorage from '@react-native-async-storage/async-storage';
import type { BaselineIngredient } from '../constants/ingredientBaseline';

// ─── Konfiguration ────────────────────────────────────────────────────────────
//
// Sobald der Gist erstellt ist, hier die Raw-URL eintragen, z.B.:
//   https://gist.githubusercontent.com/<user>/<gist-id>/raw/baseline.json
// Bei Updates des Gists: `version` im JSON inkrementieren — App holt sich beim
// nächsten Start automatisch die neue Liste.
//
export const BASELINE_GIST_URL = '';

// Schemaversion der App. Wenn das Gist-JSON eine andere Schemaversion hat,
// wird das Update verworfen (Schutz vor inkompatiblen Format-Änderungen).
export const SUPPORTED_SCHEMA_VERSION = 1;

// Mindest-Pause zwischen automatischen Syncs (App-Start fire-and-forget).
const TTL_MS = 6 * 60 * 60 * 1000; // 6 Stunden

// AsyncStorage-Keys
const CACHE_KEY = 'kochwelt_baseline_remote';
const META_KEY = 'kochwelt_baseline_remote_meta';

// ─── Datentypen ───────────────────────────────────────────────────────────────

interface RemoteBaselinePayload {
  schemaVersion: number;
  version: number;
  updatedAt?: string;
  ingredients: BaselineIngredient[];
}

interface BaselineCacheMeta {
  schemaVersion: number;
  version: number;
  updatedAt?: string;
  fetchedAt: number;
  etag?: string;
  ingredientCount: number;
}

export interface BaselineSyncStatus {
  configured: boolean;       // ist BASELINE_GIST_URL gesetzt?
  hasCache: boolean;
  version?: number;
  updatedAt?: string;
  fetchedAt?: number;        // ms
  ingredientCount?: number;
  lastError?: string;
}

export type SyncResult =
  | { kind: 'disabled' }                                        // keine URL konfiguriert
  | { kind: 'skipped'; reason: 'ttl' }                          // noch innerhalb TTL
  | { kind: 'unchanged' }                                       // 304 oder gleiche Version
  | { kind: 'updated'; version: number; ingredientCount: number }
  | { kind: 'error'; message: string };

// ─── Cache ────────────────────────────────────────────────────────────────────

async function readMeta(): Promise<BaselineCacheMeta | null> {
  try {
    const raw = await AsyncStorage.getItem(META_KEY);
    return raw ? JSON.parse(raw) as BaselineCacheMeta : null;
  } catch { return null; }
}

async function writeMeta(meta: BaselineCacheMeta): Promise<void> {
  await AsyncStorage.setItem(META_KEY, JSON.stringify(meta));
}

async function readCachedIngredients(): Promise<BaselineIngredient[] | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) as BaselineIngredient[] : null;
  } catch { return null; }
}

async function writeCachedIngredients(items: BaselineIngredient[]): Promise<void> {
  await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(items));
}

/** Liefert die zwischengespeicherte Remote-Baseline oder null, wenn noch nie geladen oder Schema inkompatibel. */
export async function getCachedRemoteBaseline(): Promise<BaselineIngredient[] | null> {
  const meta = await readMeta();
  if (!meta || meta.schemaVersion !== SUPPORTED_SCHEMA_VERSION) return null;
  return readCachedIngredients();
}

export async function getBaselineSyncStatus(): Promise<BaselineSyncStatus> {
  const meta = await readMeta();
  return {
    configured: BASELINE_GIST_URL.length > 0,
    hasCache: !!meta,
    version: meta?.version,
    updatedAt: meta?.updatedAt,
    fetchedAt: meta?.fetchedAt,
    ingredientCount: meta?.ingredientCount,
  };
}

// ─── Validierung ──────────────────────────────────────────────────────────────

function isValidPayload(data: unknown): data is RemoteBaselinePayload {
  if (!data || typeof data !== 'object') return false;
  const p = data as Partial<RemoteBaselinePayload>;
  if (typeof p.schemaVersion !== 'number') return false;
  if (typeof p.version !== 'number') return false;
  if (!Array.isArray(p.ingredients)) return false;
  // Spot-Check: jeder Eintrag braucht id + name + base_unit
  for (const ing of p.ingredients) {
    if (!ing || typeof ing.id !== 'string' || typeof ing.name !== 'string' || typeof ing.base_unit !== 'string') {
      return false;
    }
  }
  return true;
}

// ─── Sync-Aufrufe ─────────────────────────────────────────────────────────────

/**
 * Beim App-Start aufrufen (fire-and-forget). Prüft TTL und holt nur, wenn nötig.
 * Schreibt im Erfolgsfall den Cache neu; bei Fehler bleibt der vorherige Cache aktiv.
 */
export async function syncBaselineIfNeeded(): Promise<SyncResult> {
  if (!BASELINE_GIST_URL) return { kind: 'disabled' };

  const meta = await readMeta();
  const now = Date.now();
  if (meta && now - meta.fetchedAt < TTL_MS) {
    return { kind: 'skipped', reason: 'ttl' };
  }
  return performSync(meta);
}

/**
 * Manueller Refresh aus den Einstellungen. Ignoriert TTL, nutzt aber ETag.
 */
export async function syncBaselineNow(): Promise<SyncResult> {
  if (!BASELINE_GIST_URL) return { kind: 'disabled' };
  const meta = await readMeta();
  return performSync(meta);
}

async function performSync(meta: BaselineCacheMeta | null): Promise<SyncResult> {
  try {
    const headers: Record<string, string> = {};
    if (meta?.etag) headers['If-None-Match'] = meta.etag;

    const response = await fetch(BASELINE_GIST_URL, { headers });

    // 304 Not Modified → Server bestätigt: Cache ist aktuell. Nur fetchedAt updaten.
    if (response.status === 304 && meta) {
      await writeMeta({ ...meta, fetchedAt: Date.now() });
      return { kind: 'unchanged' };
    }

    if (!response.ok) {
      return { kind: 'error', message: `HTTP ${response.status}` };
    }

    const data = await response.json();
    if (!isValidPayload(data)) {
      return { kind: 'error', message: 'Ungültiges Format' };
    }
    if (data.schemaVersion !== SUPPORTED_SCHEMA_VERSION) {
      return { kind: 'error', message: `Unbekannte Schema-Version ${data.schemaVersion}` };
    }

    // Wenn wir die gleiche oder ältere Version bereits haben, nur fetchedAt bumpen.
    if (meta && data.version <= meta.version) {
      await writeMeta({ ...meta, fetchedAt: Date.now() });
      return { kind: 'unchanged' };
    }

    // Neue Version → Cache schreiben
    await writeCachedIngredients(data.ingredients);
    await writeMeta({
      schemaVersion: data.schemaVersion,
      version: data.version,
      updatedAt: data.updatedAt,
      fetchedAt: Date.now(),
      etag: response.headers.get('etag') ?? undefined,
      ingredientCount: data.ingredients.length,
    });
    return { kind: 'updated', version: data.version, ingredientCount: data.ingredients.length };
  } catch (e) {
    return { kind: 'error', message: e instanceof Error ? e.message : 'Netzwerkfehler' };
  }
}

/**
 * Test/Debug-Hilfe: löscht den Remote-Cache, sodass beim nächsten Sync das Bundle wieder aktiv wird.
 */
export async function clearBaselineCache(): Promise<void> {
  await AsyncStorage.multiRemove([CACHE_KEY, META_KEY]);
}
