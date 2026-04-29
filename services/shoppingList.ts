import { WeekPlan, PlannedMeal } from './plannerStore';
import { Recipe } from './recipeStore';

export interface ShoppingItem {
  name: string;
  amounts: string[];        // alle Einzelmengen (z.B. ["400 g", "200 g"])
  combined: string;         // zusammengefasst (z.B. "600 g")
  shopCategory: string;
  checked: boolean;
}

export type ShoppingList = Record<string, ShoppingItem[]>; // key: shopCategory

const CATEGORY_ORDER = [
  'Gemüse & Obst', 'Fleisch & Fisch', 'Mopro',
  'Trockensortiment', 'Tiefkühl', 'Vorrat', 'Sonstiges',
];

function parseAmount(str: string): { value: number; unit: string } | null {
  const FRACTIONS: Record<string, number> = { '½': 0.5, '¼': 0.25, '¾': 0.75, '⅓': 1/3, '⅔': 2/3 };
  for (const [f, v] of Object.entries(FRACTIONS)) {
    if (str.includes(f)) str = str.replace(f, String(v));
  }
  const m = str.trim().match(/^([\d.,]+)\s*(.*)$/);
  if (!m) return null;
  const value = parseFloat(m[1].replace(',', '.'));
  if (isNaN(value)) return null;
  return { value, unit: m[2].trim() };
}

export function scaleAmount(amount: string, factor: number): string {
  if (!amount.trim()) return amount;
  const parsed = parseAmount(amount);
  if (!parsed) return amount;
  const scaled = parsed.value * factor;
  const rounded = Number.isInteger(scaled) ? scaled : Math.round(scaled * 10) / 10;
  return `${rounded}${parsed.unit ? ' ' + parsed.unit : ''}`.trim();
}

function combineAmounts(amounts: string[]): string {
  if (amounts.length === 1) return amounts[0];
  // Try to sum numeric amounts with same unit
  const parsed = amounts.map(a => parseAmount(a));
  const units = [...new Set(parsed.filter(Boolean).map(p => p!.unit))];
  if (units.length === 1 && parsed.every(Boolean)) {
    const total = parsed.reduce((s, p) => s + p!.value, 0);
    const rounded = Number.isInteger(total) ? total : Math.round(total * 10) / 10;
    const detail = amounts.join(' + ');
    return `${rounded}${units[0] ? ' ' + units[0] : ''} (${detail})`;
  }
  return amounts.join(' + ');
}

export function buildShoppingList(weekPlan: WeekPlan, recipeMap: Record<string, Recipe>): ShoppingList {
  // Collect all scaled ingredients
  const raw: Record<string, { amounts: string[]; shopCategory: string }> = {};

  for (const dayPlan of Object.values(weekPlan)) {
    const meals = [dayPlan.mittag, dayPlan.abend, ...(dayPlan.snacks ?? [])].filter(Boolean) as PlannedMeal[];
    for (const meal of meals) {
      if (!meal.recipeId) continue;
      const recipe = recipeMap[meal.recipeId];
      if (!recipe) continue;
      const factor = meal.portions / (recipe.portions || 2);

      for (const ing of recipe.ingredients) {
        const key = ing.name.toLowerCase().trim();
        const scaledAmount = scaleAmount(ing.amount, factor);
        if (!raw[key]) {
          raw[key] = { amounts: [], shopCategory: ing.shopCategory };
        }
        if (scaledAmount) raw[key].amounts.push(scaledAmount);
      }
    }
  }

  // Group by shopCategory
  const result: ShoppingList = {};
  for (const [name, data] of Object.entries(raw)) {
    const cat = data.shopCategory || 'Sonstiges';
    if (!result[cat]) result[cat] = [];
    result[cat].push({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      amounts: data.amounts,
      combined: combineAmounts(data.amounts),
      shopCategory: cat,
      checked: false,
    });
  }

  // Sort items within each category
  for (const cat of Object.keys(result)) {
    result[cat].sort((a, b) => a.name.localeCompare(b.name, 'de'));
  }

  return result;
}

export function shoppingListToText(list: ShoppingList): string {
  const lines: string[] = ['🛒 Einkaufsliste\n'];
  for (const cat of CATEGORY_ORDER) {
    const items = list[cat];
    if (!items?.length) continue;
    lines.push(`\n${cat}`);
    for (const item of items) {
      lines.push(`  ${item.checked ? '✓' : '•'} ${item.combined ? item.combined + ' ' : ''}${item.name}`);
    }
  }
  return lines.join('\n');
}

export function shoppingListToICS(list: ShoppingList): string {
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Kochwelt//DE',
    'X-WR-CALNAME:Einkaufsliste',
  ];

  const stamp = new Date().toISOString().replace(/[-:.]/g, '').slice(0, 15) + 'Z';
  let idx = 0;

  for (const cat of CATEGORY_ORDER) {
    const items = list[cat];
    if (!items?.length) continue;
    for (const item of items) {
      const uid = `kochwelt-${stamp}-${idx++}@kochwelt`;
      const summary = [item.combined, item.name].filter(Boolean).join(' ');
      lines.push('BEGIN:VTODO');
      lines.push(`UID:${uid}`);
      lines.push(`DTSTAMP:${stamp}`);
      lines.push(`SUMMARY:${summary}`);
      lines.push(`CATEGORIES:${cat}`);
      lines.push('STATUS:NEEDS-ACTION');
      lines.push('END:VTODO');
    }
  }

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

export { CATEGORY_ORDER };
