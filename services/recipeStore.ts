import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';
import { BASELINE_RECIPES, BASELINE_PHOTO_MAP } from '../constants/baselineRecipes';

// ─── Photo file helpers ───────────────────────────────────────────────────────

const PHOTO_DIR = FileSystem.documentDirectory + 'recipe_photos/';

export async function saveRecipePhoto(recipeId: string, compressedUri: string): Promise<string> {
  if (Platform.OS === 'web') return compressedUri; // FileSystem nicht auf Web verfügbar
  await FileSystem.makeDirectoryAsync(PHOTO_DIR, { intermediates: true });
  const dest = PHOTO_DIR + recipeId + '.jpg';
  await FileSystem.copyAsync({ from: compressedUri, to: dest });
  return dest;
}

export async function deleteRecipePhoto(recipeId: string): Promise<void> {
  if (Platform.OS === 'web') return; // FileSystem nicht auf Web verfügbar
  const path = PHOTO_DIR + recipeId + '.jpg';
  const info = await FileSystem.getInfoAsync(path);
  if (info.exists) await FileSystem.deleteAsync(path, { idempotent: true });
}

export interface Ingredient {
  name: string;
  amount: string;
  shopCategory: string;
}

export interface Nutrition {
  kcal: number | null;
  protein: number | null;
  fat: number | null;
  carbs: number | null;
}

export interface Recipe {
  id: string;
  title: string;
  categories: string[];
  description: string;
  cookTime: number;
  portions: number;
  reference: string;
  ingredients: Ingredient[];
  nutrition: Nutrition;
  photo?: string;
  rating?: number; // 1–5
}

const STORAGE_KEY = 'kochwelt_recipes';

// ─── Seed ─────────────────────────────────────────────────────────────────────

export async function seedIfEmpty(): Promise<void> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (raw !== null) return;
  const withPhotos = BASELINE_RECIPES.map(r => ({
    ...r,
    photo: r.photo ?? BASELINE_PHOTO_MAP[r.id],
  }));
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(withPhotos));
}

// Versionsnummer – erhöhen erzwingt komplette Neu-Migration aller Baseline-Fotos
const PHOTO_VERSION = '4';
const PHOTO_VERSION_KEY = 'kochwelt_photo_version';

// Titel-basierte Foto-Zuweisungen (Schlüssel = Substring im Titel, Kleinschreibung)
const TITLE_PHOTO_MAP: Array<{ key: string; url: string }> = [
  { key: 'pfannkuchen', url: 'https://images.unsplash.com/photo-1565299543923-37dd37887442?w=800&q=80' },
];

// Ergänzt fehlende oder kaputte Fotos bei bereits gespeicherten Rezepten (versioniert)
export async function patchBaselinePhotos(): Promise<void> {
  const version = await AsyncStorage.getItem(PHOTO_VERSION_KEY);

  const list = await loadAll();
  let changed = false;

  const patched = list.map(r => {
    // Baseline-Rezepte: immer auf aktuelle Version bringen wenn Version veraltet
    if (BASELINE_PHOTO_MAP[r.id] && version !== PHOTO_VERSION) {
      changed = true;
      return { ...r, photo: BASELINE_PHOTO_MAP[r.id] };
    }
    // Titel-basierter Patch für Rezepte ohne Foto (sucht Substring im Titel)
    if (!r.photo) {
      const titleLower = r.title.toLowerCase();
      const match = TITLE_PHOTO_MAP.find(t => titleLower.includes(t.key));
      if (match) {
        changed = true;
        return { ...r, photo: match.url };
      }
    }
    return r;
  });

  if (changed) await saveAll(patched);
  await AsyncStorage.setItem(PHOTO_VERSION_KEY, PHOTO_VERSION);
}

// Versionsnummer – erhöhen erzwingt Neu-Import der Zutaten aller Baseline-Rezepte
const INGREDIENTS_VERSION = '2';
const INGREDIENTS_VERSION_KEY = 'kochwelt_ingredients_version';

// Aktualisiert Zutaten aller Baseline-Rezepte aus BASELINE_RECIPES (versioniert)
export async function patchBaselineIngredients(): Promise<void> {
  const version = await AsyncStorage.getItem(INGREDIENTS_VERSION_KEY);
  if (version === INGREDIENTS_VERSION) return;

  const baselineById = new Map(BASELINE_RECIPES.map(r => [r.id, r]));
  const list = await loadAll();
  let changed = false;

  const patched = list.map(r => {
    const base = baselineById.get(r.id);
    if (!base) return r; // Nutzer-eigenes Rezept — nicht anfassen
    changed = true;
    return { ...r, ingredients: base.ingredients, portions: base.portions };
  });

  if (changed) await saveAll(patched);
  await AsyncStorage.setItem(INGREDIENTS_VERSION_KEY, INGREDIENTS_VERSION);
}

// ─── CRUD ─────────────────────────────────────────────────────────────────────

async function loadAll(): Promise<Recipe[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : [];
}

async function saveAll(recipes: Recipe[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(recipes));
}

export async function getAllRecipes(): Promise<Recipe[]> {
  const list = await loadAll();
  return list.sort((a, b) => a.title.localeCompare(b.title, 'de'));
}

export async function getRecipeById(id: string): Promise<Recipe | null> {
  const list = await loadAll();
  return list.find(r => r.id === id) ?? null;
}

export async function saveRecipe(recipe: Recipe): Promise<void> {
  const list = await loadAll();
  const idx = list.findIndex(r => r.id === recipe.id);
  if (idx >= 0) list[idx] = recipe;
  else list.push(recipe);
  await saveAll(list);
}

export async function setRecipeRating(id: string, rating: number | undefined): Promise<void> {
  const list = await loadAll();
  const idx = list.findIndex(r => r.id === id);
  if (idx < 0) return;
  list[idx] = { ...list[idx], rating };
  await saveAll(list);
}

export async function deleteRecipe(id: string): Promise<void> {
  const list = await loadAll();
  await saveAll(list.filter(r => r.id !== id));
  await deleteRecipePhoto(id);
}

export function createId(): string {
  return `r_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

// ─── Auto-Teaser ──────────────────────────────────────────────────────────────

export interface RecipeTeaser {
  attrs: string;       // z.B. "Vegetarisch · 30 min · 8 Zutaten"
  ingredients: string; // z.B. "Mit Porree, Butter und Sahne"
}

export function buildTeaser(recipe: Recipe): RecipeTeaser {
  const attrParts: string[] = [];
  if (recipe.categories.length > 0) attrParts.push(recipe.categories.slice(0, 2).join(' · '));
  attrParts.push(`${recipe.cookTime} min`);
  attrParts.push(`${recipe.ingredients.length} Zutaten`);

  const top = recipe.ingredients.slice(0, 3).map(i => i.name);
  const rest = recipe.ingredients.length - top.length;
  let ingredients = '';
  if (top.length === 1) {
    ingredients = `Mit ${top[0]}`;
  } else if (top.length === 2) {
    ingredients = `Mit ${top[0]} und ${top[1]}`;
  } else if (top.length >= 3) {
    ingredients = `Mit ${top[0]}, ${top[1]} und ${top[2]}`;
    if (rest > 0) ingredients += ` +${rest}`;
  }

  return { attrs: attrParts.join(' · '), ingredients };
}

// ─── Export / Import ──────────────────────────────────────────────────────────

/** Gibt alle Rezepte als JSON-String zurück (ohne Foto-Pfade). */
export async function exportRecipesJSON(): Promise<string> {
  const list = await loadAll();
  const clean = list.map(({ photo: _photo, ...r }) => r);
  return JSON.stringify(clean, null, 2);
}

export interface ImportResult {
  updated: number;
  added: number;
  errors: string[];
}

/** Liest eine JSON-Datei ein und führt sie mit dem gespeicherten Stand zusammen.
 *  Vorhandene Fotos bleiben erhalten. Neue IDs werden hinzugefügt. */
export async function importRecipesJSON(json: string): Promise<ImportResult> {
  const result: ImportResult = { updated: 0, added: 0, errors: [] };
  let incoming: unknown[];
  try {
    const parsed = JSON.parse(json);
    if (!Array.isArray(parsed)) throw new Error('Kein Array');
    incoming = parsed;
  } catch {
    throw new Error('Ungültiges JSON-Format');
  }

  const existing = await loadAll();
  const byId = new Map<string, Recipe>(existing.map(r => [r.id, r]));

  for (const raw of incoming) {
    const r = raw as Partial<Recipe>;
    if (!r.id || typeof r.id !== 'string') { result.errors.push(`Rezept ohne ID übersprungen`); continue; }
    if (!r.title || typeof r.title !== 'string') { result.errors.push(`${r.id}: kein Titel`); continue; }

    const recipe: Recipe = {
      id: r.id,
      title: r.title,
      categories: Array.isArray(r.categories) ? r.categories : [],
      description: typeof r.description === 'string' ? r.description : '',
      cookTime: typeof r.cookTime === 'number' ? r.cookTime : 0,
      portions: typeof r.portions === 'number' ? r.portions : 2,
      reference: typeof r.reference === 'string' ? r.reference : '',
      ingredients: Array.isArray(r.ingredients) ? r.ingredients : [],
      nutrition: r.nutrition ?? { kcal: null, protein: null, fat: null, carbs: null },
      photo: byId.get(r.id)?.photo, // Vorhandenes Foto behalten
    };

    if (byId.has(r.id)) result.updated++;
    else result.added++;
    byId.set(r.id, recipe);
  }

  await saveAll([...byId.values()]);
  return result;
}

export const RECIPE_TABS = [
  'Alle', 'Pasta', 'Reis', 'Curry', 'Suppe',
  'Fisch', 'Fleisch', 'Vegetarisch', 'Salat', 'Eintopf', 'Ohne Kategorie',
];
