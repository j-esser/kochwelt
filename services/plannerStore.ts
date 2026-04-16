import AsyncStorage from '@react-native-async-storage/async-storage';

export type MealSlot = 'mittag' | 'abend';

export interface PlannedMeal {
  recipeId?: string;         // undefined bei manuellen Einträgen
  portions: number;
  // Kalte Küche / manuelle Einträge:
  manualTitle?: string;
  manualNutrition?: { kcal: number; protein: number; fat: number; carbs: number };
}

export const COLD_MEAL_DEFAULTS: Record<MealSlot, PlannedMeal['manualNutrition']> = {
  mittag: { kcal: 550, protein: 25, fat: 20, carbs: 60 },
  abend:  { kcal: 400, protein: 20, fat: 15, carbs: 45 },
};

export type DayPlan = Partial<Record<MealSlot, PlannedMeal>>;
export type WeekPlan = Record<string, DayPlan>; // key: "YYYY-MM-DD"

const KEY = 'kochwelt_weekplan';

export async function getWeekPlan(): Promise<WeekPlan> {
  const raw = await AsyncStorage.getItem(KEY);
  return raw ? JSON.parse(raw) : {};
}

export async function setMeal(date: string, slot: MealSlot, meal: PlannedMeal | null): Promise<void> {
  const plan = await getWeekPlan();
  if (!plan[date]) plan[date] = {};
  if (meal === null) {
    delete plan[date][slot];
    if (Object.keys(plan[date]).length === 0) delete plan[date];
  } else {
    plan[date][slot] = meal;
  }
  await AsyncStorage.setItem(KEY, JSON.stringify(plan));
}

// Returns Monday of the week containing `date`
export function weekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = (day === 0 ? -6 : 1 - day);
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function addDays(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

export const WEEKDAYS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
export const WEEKDAYS_LONG = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];

// Returns sorted list of dates (YYYY-MM-DD) when a specific recipe was planned
export async function getCookDatesForRecipe(recipeId: string, days: number): Promise<string[]> {
  const plan = await getWeekPlan();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  cutoff.setHours(0, 0, 0, 0);
  const seen = new Set<string>();
  for (const [dateKey, dayPlan] of Object.entries(plan)) {
    if (new Date(dateKey + 'T12:00:00') >= cutoff) {
      for (const meal of Object.values(dayPlan)) {
        if (meal.recipeId === recipeId) seen.add(dateKey);
      }
    }
  }
  return [...seen].sort();
}

// Wochenstats für Startseite-Badges
export interface WeekStats {
  days: number;    // Tage mit ≥1 Mahlzeit
  meals: number;   // Gesamtanzahl Mahlzeiten
}

export async function getWeekStats(): Promise<WeekStats> {
  const plan = await getWeekPlan();
  const monday = weekStart(new Date());
  let days = 0, meals = 0;
  for (let i = 0; i < 7; i++) {
    const key = toDateKey(addDays(monday, i));
    const dayPlan = plan[key];
    if (dayPlan) {
      const count = Object.keys(dayPlan).length;
      if (count > 0) { days++; meals += count; }
    }
  }
  return { days, meals };
}

// Returns how many times each recipeId was planned in the last `days` days
export async function getCookCountsLastNDays(days: number): Promise<Record<string, number>> {
  const plan = await getWeekPlan();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  cutoff.setHours(0, 0, 0, 0);
  const counts: Record<string, number> = {};
  for (const [dateKey, dayPlan] of Object.entries(plan)) {
    if (new Date(dateKey) >= cutoff) {
      for (const meal of Object.values(dayPlan)) {
        if (meal.recipeId) counts[meal.recipeId] = (counts[meal.recipeId] ?? 0) + 1;
      }
    }
  }
  return counts;
}
