import AsyncStorage from '@react-native-async-storage/async-storage';
import { BaselineIngredient } from '@/constants/ingredientBaseline';
import { bundledBaseline } from './ingredientBaseline';
import { getCachedRemoteBaseline } from './baselineSync';

const USER_INGREDIENTS_KEY = 'kochwelt_user_ingredients';

export type UserIngredient = BaselineIngredient;

export async function loadUserIngredients(): Promise<UserIngredient[]> {
  try {
    const json = await AsyncStorage.getItem(USER_INGREDIENTS_KEY);
    return json ? JSON.parse(json) : [];
  } catch {
    return [];
  }
}

async function saveUserIngredients(items: UserIngredient[]): Promise<void> {
  await AsyncStorage.setItem(USER_INGREDIENTS_KEY, JSON.stringify(items));
}

export async function addUserIngredients(newItems: UserIngredient[]): Promise<void> {
  const existing = await loadUserIngredients();
  const map = new Map(existing.map(e => [e.id, e]));
  for (const item of newItems) map.set(item.id, item);
  await saveUserIngredients(Array.from(map.values()));
}

export async function loadBaseline(): Promise<BaselineIngredient[]> {
  // Datenquellen-Hierarchie: Remote-Cache (falls vorhanden) → Bundle → User-Einträge.
  // User-Einträge werden NIEMALS überschrieben oder gelöscht, nur ergänzt.
  const remote = await getCachedRemoteBaseline();
  const baseline = remote ?? bundledBaseline();
  const user = await loadUserIngredients();
  const map = new Map<string, BaselineIngredient>(baseline.map(b => [b.id, b]));
  for (const u of user) map.set(u.id, u);
  return Array.from(map.values());
}
