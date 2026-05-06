import AsyncStorage from '@react-native-async-storage/async-storage';
import { saveRecipe, type Recipe } from './recipeStore';

// ─── Konfiguration ────────────────────────────────────────────────────────────
//
// Sobald der Geschenk-Gist erstellt ist, hier die Raw-URL eintragen.
// Format wie bei der Baseline; jeder neue Gift-Eintrag inkrementiert `version`.
//
export const GIFT_GIST_URL = 'https://gist.githubusercontent.com/j-esser/5f7d11565cf87fba40812b5a789288fe/raw/gifts.json';

export const SUPPORTED_GIFT_SCHEMA_VERSION = 1;
const TTL_MS = 6 * 60 * 60 * 1000; // 6 Stunden

// AsyncStorage-Keys
const META_KEY = 'kochwelt_gifts_remote_meta';
const CACHE_KEY = 'kochwelt_gifts_remote_cache';
const DELIVERED_KEY = 'kochwelt_gifts_delivered';   // Set<gift.id> — dauerhaft
const UNREAD_KEY = 'kochwelt_gifts_unread';         // Set<gift.id> — vom Banner verbraucht
const ENABLED_KEY = 'kochwelt_gifts_enabled';       // 'true' | 'false', Default 'true'

// ─── Datentypen ───────────────────────────────────────────────────────────────

export interface GiftEntry {
  id: string;                  // stabile ID, z.B. 'g_2026_05_porreetorte' — Tracking-Schlüssel
  deliverAfter: string;        // YYYY-MM-DD; Geschenke werden erst ab diesem Datum geliefert
  recipe: Recipe;              // vollständiges Recipe-Objekt, photo als HTTPS-URL
}

interface GiftPayload {
  schemaVersion: number;
  version: number;
  updatedAt?: string;
  gifts: GiftEntry[];
}

interface GiftCacheMeta {
  schemaVersion: number;
  version: number;
  updatedAt?: string;
  fetchedAt: number;
  etag?: string;
  giftCount: number;
}

export interface GiftSyncStatus {
  configured: boolean;
  hasCache: boolean;
  enabled: boolean;
  version?: number;
  updatedAt?: string;
  fetchedAt?: number;
  giftCount?: number;
  unreadCount: number;
  deliveredCount: number;
}

export type GiftSyncResult =
  | { kind: 'disabled' }
  | { kind: 'skipped'; reason: 'ttl' | 'opted-out' }
  | { kind: 'unchanged' }
  | { kind: 'updated'; version: number; giftCount: number }
  | { kind: 'error'; message: string };

export interface DeliveryResult {
  delivered: number;
  newUnread: string[];   // gift.ids
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function readJSON<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? JSON.parse(raw) as T : null;
  } catch { return null; }
}

async function writeJSON(key: string, value: unknown): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

async function readSet(key: string): Promise<Set<string>> {
  const arr = await readJSON<string[]>(key);
  return new Set(arr ?? []);
}

async function writeSet(key: string, set: Set<string>): Promise<void> {
  await writeJSON(key, Array.from(set));
}

function isValidPayload(data: unknown): data is GiftPayload {
  if (!data || typeof data !== 'object') return false;
  const p = data as Partial<GiftPayload>;
  if (typeof p.schemaVersion !== 'number') return false;
  if (typeof p.version !== 'number') return false;
  if (!Array.isArray(p.gifts)) return false;
  for (const g of p.gifts) {
    if (!g || typeof g.id !== 'string' || typeof g.deliverAfter !== 'string') return false;
    if (!g.recipe || typeof g.recipe.id !== 'string' || typeof g.recipe.title !== 'string') return false;
  }
  return true;
}

// ─── Settings ─────────────────────────────────────────────────────────────────

export async function isGiftsEnabled(): Promise<boolean> {
  const v = await AsyncStorage.getItem(ENABLED_KEY);
  return v !== 'false'; // Default: an
}

export async function setGiftsEnabled(enabled: boolean): Promise<void> {
  await AsyncStorage.setItem(ENABLED_KEY, enabled ? 'true' : 'false');
}

// ─── Sync ─────────────────────────────────────────────────────────────────────

export async function syncGiftsIfNeeded(): Promise<GiftSyncResult> {
  if (!GIFT_GIST_URL) return { kind: 'disabled' };
  const meta = await readJSON<GiftCacheMeta>(META_KEY);
  if (meta && Date.now() - meta.fetchedAt < TTL_MS) {
    return { kind: 'skipped', reason: 'ttl' };
  }
  return performSync(meta);
}

export async function syncGiftsNow(): Promise<GiftSyncResult> {
  if (!GIFT_GIST_URL) return { kind: 'disabled' };
  const meta = await readJSON<GiftCacheMeta>(META_KEY);
  return performSync(meta);
}

async function performSync(meta: GiftCacheMeta | null): Promise<GiftSyncResult> {
  try {
    const headers: Record<string, string> = {};
    if (meta?.etag) headers['If-None-Match'] = meta.etag;
    const res = await fetch(GIFT_GIST_URL, { headers });

    if (res.status === 304 && meta) {
      await writeJSON(META_KEY, { ...meta, fetchedAt: Date.now() });
      return { kind: 'unchanged' };
    }
    if (!res.ok) return { kind: 'error', message: `HTTP ${res.status}` };

    const data = await res.json();
    if (!isValidPayload(data)) return { kind: 'error', message: 'Ungültiges Format' };
    if (data.schemaVersion !== SUPPORTED_GIFT_SCHEMA_VERSION) {
      return { kind: 'error', message: `Unbekannte Schema-Version ${data.schemaVersion}` };
    }
    if (meta && data.version <= meta.version) {
      await writeJSON(META_KEY, { ...meta, fetchedAt: Date.now() });
      return { kind: 'unchanged' };
    }

    await writeJSON(CACHE_KEY, data.gifts);
    const newMeta: GiftCacheMeta = {
      schemaVersion: data.schemaVersion,
      version: data.version,
      updatedAt: data.updatedAt,
      fetchedAt: Date.now(),
      etag: res.headers.get('etag') ?? undefined,
      giftCount: data.gifts.length,
    };
    await writeJSON(META_KEY, newMeta);
    return { kind: 'updated', version: data.version, giftCount: data.gifts.length };
  } catch (e) {
    return { kind: 'error', message: e instanceof Error ? e.message : 'Netzwerkfehler' };
  }
}

// ─── Delivery ─────────────────────────────────────────────────────────────────

/**
 * Wendet alle fälligen Geschenke aus dem Cache auf den User-Rezeptbestand an:
 * - importiert das Recipe-Objekt nur, wenn gift.id noch nicht in `delivered` ist
 * - markiert gift.id als delivered + unread
 * - respektiert `deliverAfter` (Geschenk wird erst ab Datum geliefert)
 * - keine Lieferung bei deaktiviertem Toggle
 *
 * Ist idempotent: mehrfacher Aufruf liefert nichts doppelt.
 */
export async function deliverPendingGifts(): Promise<DeliveryResult> {
  const enabled = await isGiftsEnabled();
  if (!enabled) return { delivered: 0, newUnread: [] };

  const cache = await readJSON<GiftEntry[]>(CACHE_KEY);
  if (!cache || cache.length === 0) return { delivered: 0, newUnread: [] };

  const delivered = await readSet(DELIVERED_KEY);
  const unread = await readSet(UNREAD_KEY);
  const today = new Date().toISOString().slice(0, 10);
  const newUnread: string[] = [];

  for (const gift of cache) {
    if (delivered.has(gift.id)) continue;
    if (gift.deliverAfter > today) continue;
    try {
      await saveRecipe(gift.recipe);
      delivered.add(gift.id);
      unread.add(gift.id);
      newUnread.push(gift.id);
    } catch {
      // Recipe-Save fehlgeschlagen — gift.id NICHT als delivered markieren,
      // damit es beim nächsten Versuch erneut probiert wird.
    }
  }

  if (newUnread.length > 0) {
    await writeSet(DELIVERED_KEY, delivered);
    await writeSet(UNREAD_KEY, unread);
  }
  return { delivered: newUnread.length, newUnread };
}

// ─── Banner-Queue ─────────────────────────────────────────────────────────────

/** Liefert ungelesene Geschenke (in Reihenfolge ihres Vorkommens im Cache). */
export async function getUnreadGifts(): Promise<GiftEntry[]> {
  const unread = await readSet(UNREAD_KEY);
  if (unread.size === 0) return [];
  const cache = await readJSON<GiftEntry[]>(CACHE_KEY);
  if (!cache) return [];
  return cache.filter(g => unread.has(g.id));
}

export async function markGiftRead(giftId: string): Promise<void> {
  const unread = await readSet(UNREAD_KEY);
  if (unread.delete(giftId)) await writeSet(UNREAD_KEY, unread);
}

export async function markAllGiftsRead(): Promise<void> {
  await writeSet(UNREAD_KEY, new Set());
}

// ─── Status für Settings-UI ───────────────────────────────────────────────────

export async function getGiftSyncStatus(): Promise<GiftSyncStatus> {
  const meta = await readJSON<GiftCacheMeta>(META_KEY);
  const delivered = await readSet(DELIVERED_KEY);
  const unread = await readSet(UNREAD_KEY);
  const enabled = await isGiftsEnabled();
  return {
    configured: GIFT_GIST_URL.length > 0,
    hasCache: !!meta,
    enabled,
    version: meta?.version,
    updatedAt: meta?.updatedAt,
    fetchedAt: meta?.fetchedAt,
    giftCount: meta?.giftCount,
    unreadCount: unread.size,
    deliveredCount: delivered.size,
  };
}

// ─── Submission ───────────────────────────────────────────────────────────────

/**
 * Baut eine GitHub-Issue-URL, die den User in den Browser schickt, um sein
 * Rezept als Issue einzureichen. Repo + Label sind fest verdrahtet.
 */
export function buildSubmissionUrl(recipe: Recipe): string {
  const cleanRecipe = { ...recipe };
  // Lokale Foto-Pfade entfernen — sind auf dem Empfänger-Gerät nicht erreichbar.
  if (cleanRecipe.photo && !cleanRecipe.photo.startsWith('http')) {
    delete cleanRecipe.photo;
  }
  const title = `Rezept-Vorschlag: ${recipe.title}`;
  const body = [
    `Hier ist ein Rezept-Vorschlag für die Geschenk-Sammlung.`,
    ``,
    `**Titel:** ${recipe.title}`,
    `**Kochzeit:** ${recipe.cookTime} min`,
    `**Portionen:** ${recipe.portions}`,
    ``,
    `<details><summary>JSON</summary>`,
    ``,
    '```json',
    JSON.stringify(cleanRecipe, null, 2),
    '```',
    ``,
    `</details>`,
  ].join('\n');

  const params = new URLSearchParams({
    title,
    body,
    labels: 'rezept-vorschlag',
  });
  return `https://github.com/j-esser/kochwelt/issues/new?${params.toString()}`;
}

// ─── Debug ────────────────────────────────────────────────────────────────────

export async function clearGiftsCache(): Promise<void> {
  await AsyncStorage.multiRemove([META_KEY, CACHE_KEY, UNREAD_KEY]);
  // delivered bleibt absichtlich erhalten — User soll bei Cache-Reset nicht alles nochmal bekommen
}
