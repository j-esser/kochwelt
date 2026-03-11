import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASELINE_RECIPES } from '../constants/baselineRecipes';

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
}

const STORAGE_KEY = 'kochwelt_recipes';

// ─── Seed ─────────────────────────────────────────────────────────────────────

export async function seedIfEmpty(): Promise<void> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (raw !== null) return;
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(BASELINE_RECIPES));
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

export async function deleteRecipe(id: string): Promise<void> {
  const list = await loadAll();
  await saveAll(list.filter(r => r.id !== id));
}

export function createId(): string {
  return `r_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

export const RECIPE_TABS = [
  'Alle', 'Pasta', 'Reis', 'Curry', 'Suppe',
  'Fisch', 'Fleisch', 'Vegetarisch', 'Salat', 'Eintopf', 'Ohne Kategorie',
];
