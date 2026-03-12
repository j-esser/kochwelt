import AsyncStorage from '@react-native-async-storage/async-storage';

export type MealSlot = 'mittag' | 'abend';

export interface PlannedMeal {
  recipeId: string;
  portions: number;
}

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
        counts[meal.recipeId] = (counts[meal.recipeId] ?? 0) + 1;
      }
    }
  }
  return counts;
}
