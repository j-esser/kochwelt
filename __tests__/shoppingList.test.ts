import { buildShoppingList, shoppingListToText } from '../services/shoppingList';
import type { WeekPlan } from '../services/plannerStore';
import type { Recipe } from '../services/recipeStore';

// ─── Fixtures ────────────────────────────────────────────────────────────────

const recipeA: Recipe = {
  id: 'r1',
  title: 'Pasta',
  description: '',
  cookTime: 20,
  portions: 2,
  categories: ['Pasta'],
  ingredients: [
    { name: 'Nudeln', amount: '200 g', shopCategory: 'Trockensortiment' },
    { name: 'Tomaten', amount: '400 g', shopCategory: 'Gemüse & Obst' },
  ],
  nutrition: { kcal: null, protein: null, fat: null, carbs: null },
  reference: '',
};

const recipeB: Recipe = {
  id: 'r2',
  title: 'Salat',
  description: '',
  cookTime: 10,
  portions: 4,
  categories: ['Salat'],
  ingredients: [
    { name: 'Tomaten', amount: '200 g', shopCategory: 'Gemüse & Obst' },
    { name: 'Gurke', amount: '1 Stück', shopCategory: 'Gemüse & Obst' },
  ],
  nutrition: { kcal: null, protein: null, fat: null, carbs: null },
  reference: '',
};

const recipeMap = { r1: recipeA, r2: recipeB };

// ─── buildShoppingList ────────────────────────────────────────────────────────

describe('buildShoppingList', () => {
  test('leerer Plan ergibt leere Liste', () => {
    expect(buildShoppingList({}, recipeMap)).toEqual({});
  });

  test('einzelne Mahlzeit erscheint korrekt skaliert', () => {
    const plan: WeekPlan = {
      '2024-01-01': { mittag: { recipeId: 'r1', portions: 2 } },
    };
    const list = buildShoppingList(plan, recipeMap);
    const nudeln = list['Trockensortiment']?.find(i => i.name === 'Nudeln');
    expect(nudeln).toBeDefined();
    expect(nudeln!.combined).toBe('200 g');
  });

  test('Portionsskalierung: doppelte Portionen → doppelte Menge', () => {
    const plan: WeekPlan = {
      '2024-01-01': { mittag: { recipeId: 'r1', portions: 4 } }, // 4 statt 2 Portionen
    };
    const list = buildShoppingList(plan, recipeMap);
    const nudeln = list['Trockensortiment']?.find(i => i.name === 'Nudeln');
    expect(nudeln!.combined).toBe('400 g');
  });

  test('gleiche Zutat aus zwei Mahlzeiten wird zusammengefasst', () => {
    const plan: WeekPlan = {
      '2024-01-01': { mittag: { recipeId: 'r1', portions: 2 } },
      '2024-01-02': { mittag: { recipeId: 'r2', portions: 4 } },
    };
    const list = buildShoppingList(plan, recipeMap);
    const tomaten = list['Gemüse & Obst']?.find(i => i.name === 'Tomaten');
    expect(tomaten).toBeDefined();
    // r1: 400g (1× Rezeptportionen) + r2: 200g (1× Rezeptportionen) = 600g
    expect(tomaten!.combined).toContain('600 g');
  });

  test('unbekanntes Rezept wird übersprungen', () => {
    const plan: WeekPlan = {
      '2024-01-01': { mittag: { recipeId: 'unbekannt', portions: 2 } },
    };
    expect(buildShoppingList(plan, recipeMap)).toEqual({});
  });

  test('Zutaten ohne Menge werden aufgelistet (kein Absturz)', () => {
    const recipeNoAmount: Recipe = {
      ...recipeA,
      id: 'r3',
      ingredients: [{ name: 'Salz', amount: '', shopCategory: 'Vorrat' }],
    };
    const plan: WeekPlan = {
      '2024-01-01': { mittag: { recipeId: 'r3', portions: 2 } },
    };
    const list = buildShoppingList(plan, { r3: recipeNoAmount });
    // Salz sollte trotzdem erscheinen
    expect(list['Vorrat']?.find(i => i.name === 'Salz')).toBeDefined();
  });

  test('Zutatenname wird mit Großbuchstabe normalisiert', () => {
    const plan: WeekPlan = {
      '2024-01-01': { mittag: { recipeId: 'r1', portions: 2 } },
    };
    const list = buildShoppingList(plan, recipeMap);
    const items = Object.values(list).flat();
    items.forEach(item => {
      expect(item.name[0]).toBe(item.name[0].toUpperCase());
    });
  });

  test('Zutaten innerhalb einer Kategorie sind alphabetisch sortiert', () => {
    const plan: WeekPlan = {
      '2024-01-01': {
        mittag: { recipeId: 'r1', portions: 2 },
        abend: { recipeId: 'r2', portions: 4 },
      },
    };
    const list = buildShoppingList(plan, recipeMap);
    const gemüse = list['Gemüse & Obst']?.map(i => i.name) ?? [];
    expect(gemüse).toEqual([...gemüse].sort((a, b) => a.localeCompare(b, 'de')));
  });
});

// ─── shoppingListToText ───────────────────────────────────────────────────────

describe('shoppingListToText', () => {
  test('leere Liste ergibt nur die Überschrift', () => {
    const text = shoppingListToText({});
    expect(text).toContain('Einkaufsliste');
    expect(text).not.toContain('Gemüse');
  });

  test('enthält Kategorienamen und Zutaten', () => {
    const plan: WeekPlan = {
      '2024-01-01': { mittag: { recipeId: 'r1', portions: 2 } },
    };
    const list = buildShoppingList(plan, recipeMap);
    const text = shoppingListToText(list);
    expect(text).toContain('Trockensortiment');
    expect(text).toContain('Nudeln');
    expect(text).toContain('Gemüse & Obst');
    expect(text).toContain('Tomaten');
  });
});
