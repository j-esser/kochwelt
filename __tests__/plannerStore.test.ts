import { weekStart, addDays, toDateKey, getCookCountsLastNDays } from '../services/plannerStore';

// ─── Reine Hilfsfunktionen (kein AsyncStorage) ────────────────────────────────

// Dates werden mit T12:00:00 (lokale Mittagszeit) erstellt, um Timezone-Probleme
// bei der UTC-Ausgabe von toISOString() zu vermeiden.
describe('weekStart', () => {
  test('Montag bleibt Montag', () => {
    const monday = new Date('2024-01-08T12:00:00');
    expect(toDateKey(weekStart(monday))).toBe('2024-01-08');
  });

  test('Mittwoch → Montag der gleichen Woche', () => {
    const wednesday = new Date('2024-01-10T12:00:00');
    expect(toDateKey(weekStart(wednesday))).toBe('2024-01-08');
  });

  test('Sonntag → Montag der gleichen Woche (ISO-Woche)', () => {
    const sunday = new Date('2024-01-14T12:00:00');
    expect(toDateKey(weekStart(sunday))).toBe('2024-01-08');
  });

  test('Samstag → Montag der gleichen Woche', () => {
    const saturday = new Date('2024-01-13T12:00:00');
    expect(toDateKey(weekStart(saturday))).toBe('2024-01-08');
  });
});

describe('addDays', () => {
  test('0 Tage → gleiches Datum', () => {
    const d = new Date('2024-03-15');
    expect(toDateKey(addDays(d, 0))).toBe('2024-03-15');
  });

  test('7 Tage vorwärts', () => {
    const d = new Date('2024-03-15');
    expect(toDateKey(addDays(d, 7))).toBe('2024-03-22');
  });

  test('negative Tage rückwärts', () => {
    const d = new Date('2024-03-15');
    expect(toDateKey(addDays(d, -3))).toBe('2024-03-12');
  });

  test('Monatsgrenze wird korrekt behandelt', () => {
    const d = new Date('2024-01-30');
    expect(toDateKey(addDays(d, 3))).toBe('2024-02-02');
  });
});

describe('toDateKey', () => {
  test('gibt YYYY-MM-DD zurück', () => {
    const d = new Date('2024-06-05T12:00:00Z');
    expect(toDateKey(d)).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

// ─── getCookCountsLastNDays (mit AsyncStorage-Mock) ───────────────────────────

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

import AsyncStorage from '@react-native-async-storage/async-storage';

describe('getCookCountsLastNDays', () => {
  beforeEach(() => jest.clearAllMocks());

  test('leerer Plan ergibt leeres Objekt', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify({}));
    const counts = await getCookCountsLastNDays(28);
    expect(counts).toEqual({});
  });

  test('zählt Rezept das innerhalb des Zeitraums liegt', async () => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const dateKey = toDateKey(yesterday);

    const plan = { [dateKey]: { mittag: { recipeId: 'r1', portions: 2 } } };
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(plan));

    const counts = await getCookCountsLastNDays(28);
    expect(counts['r1']).toBe(1);
  });

  test('ignoriert Einträge außerhalb des Zeitraums', async () => {
    const old = new Date();
    old.setDate(old.getDate() - 60);
    const dateKey = toDateKey(old);

    const plan = { [dateKey]: { mittag: { recipeId: 'r1', portions: 2 } } };
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(plan));

    const counts = await getCookCountsLastNDays(28);
    expect(counts['r1']).toBeUndefined();
  });

  test('zählt dasselbe Rezept an mehreren Tagen', async () => {
    const today = new Date();
    const d1 = toDateKey(new Date(today.getTime() - 1 * 86400000));
    const d2 = toDateKey(new Date(today.getTime() - 5 * 86400000));
    const d3 = toDateKey(new Date(today.getTime() - 10 * 86400000));

    const plan = {
      [d1]: { mittag: { recipeId: 'r1', portions: 2 } },
      [d2]: { abend: { recipeId: 'r1', portions: 2 } },
      [d3]: { mittag: { recipeId: 'r2', portions: 4 } },
    };
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(plan));

    const counts = await getCookCountsLastNDays(28);
    expect(counts['r1']).toBe(2);
    expect(counts['r2']).toBe(1);
  });
});
