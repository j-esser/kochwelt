import AsyncStorage from '@react-native-async-storage/async-storage';

export interface MealSplits {
  frueh: number;   // %
  mittag: number;  // %
  abend: number;   // %
  sonst: number;   // %
}

export interface NutritionGoals {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  splits: MealSplits;
}

export const DEFAULT_GOALS: NutritionGoals = {
  kcal: 2000,
  protein: 75,
  carbs: 250,
  fat: 70,
  splits: { frueh: 25, mittag: 35, abend: 30, sonst: 10 },
};

const KEY = 'kochwelt_nutrition_goals';

export async function getNutritionGoals(): Promise<NutritionGoals> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return { ...DEFAULT_GOALS, splits: { ...DEFAULT_GOALS.splits } };
  const parsed = JSON.parse(raw);
  return {
    ...DEFAULT_GOALS,
    ...parsed,
    splits: { ...DEFAULT_GOALS.splits, ...(parsed.splits ?? {}) },
  };
}

export async function saveNutritionGoals(goals: NutritionGoals): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(goals));
}
