import { WeekPlan, PlannedMeal } from './plannerStore';
import { Recipe } from './recipeStore';
import { BASELINE_INGREDIENTS } from '../constants/ingredientBaseline';
import { resolveAmountInBase, formatBaseAmount, matchIngredient } from './ingredientBaseline';

export interface ShoppingItem {
  name: string;
  baselineId?: string;
  amounts: string[];                                          // Original-Mengen, skaliert
  baseAmount?: { value: number; unit: 'g' | 'ml' | 'Stück' }; // konvertierte Summe (wenn alle konvertierbar)
  combined: string;                                           // Anzeige-String
  shopCategory: string;
  checked: boolean;
}

export type ShoppingList = Record<string, ShoppingItem[]>;

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

// Legacy-Fallback: summiert nur, wenn alle Mengen identische Unit-Strings haben
function combineAmountsLegacy(amounts: string[]): string {
  if (amounts.length === 1) return amounts[0];
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

interface Bucket {
  name: string;
  baselineId?: string;
  amounts: string[];
  baseSum?: { value: number; unit: 'g' | 'ml' | 'Stück' };
  unconvertible: number; // Anzahl Einträge, die nicht in base_unit umgerechnet werden konnten
  shopCategory: string;
}

export function buildShoppingList(weekPlan: WeekPlan, recipeMap: Record<string, Recipe>): ShoppingList {
  const baselineById = new Map(BASELINE_INGREDIENTS.map(b => [b.id, b]));
  const buckets = new Map<string, Bucket>();

  for (const dayPlan of Object.values(weekPlan)) {
    const meals = [dayPlan.mittag, dayPlan.abend, ...(dayPlan.snacks ?? [])].filter(Boolean) as PlannedMeal[];
    for (const meal of meals) {
      if (!meal.recipeId) continue;
      const recipe = recipeMap[meal.recipeId];
      if (!recipe) continue;
      const factor = meal.portions / (recipe.portions || 2);

      for (const ing of recipe.ingredients) {
        // Baseline ggf. on-the-fly ermitteln (für Nutzer-Rezepte ohne migrierte baselineId)
        let baseline = ing.baselineId ? baselineById.get(ing.baselineId) : undefined;
        let parsedQty = ing.parsedQuantity;
        let parsedUnit = ing.parsedUnit;
        if (!baseline) {
          const line = [ing.amount, ing.name].filter(Boolean).join(' ');
          const m = matchIngredient(line, BASELINE_INGREDIENTS);
          if (m.baseline) { baseline = m.baseline; parsedQty = m.quantity; parsedUnit = m.unit; }
        }

        const baselineId = baseline?.id;
        const key = baselineId ?? ing.name.toLowerCase().trim();
        const displayName = baseline?.name ?? (ing.name.charAt(0).toUpperCase() + ing.name.slice(1));
        const shopCategory = baseline?.category ?? ing.shopCategory ?? 'Sonstiges';

        let bucket = buckets.get(key);
        if (!bucket) {
          bucket = { name: displayName, baselineId, amounts: [], unconvertible: 0, shopCategory };
          buckets.set(key, bucket);
        }

        const scaledAmount = scaleAmount(ing.amount, factor);
        const hasAmount = !!scaledAmount.trim();
        if (hasAmount) bucket.amounts.push(scaledAmount);

        // Versuch: Menge in base_unit umrechnen und summieren
        if (baseline && parsedQty != null) {
          const scaledQty = parsedQty * factor;
          const inBase = resolveAmountInBase(scaledQty, parsedUnit, baseline);
          if (inBase != null) {
            if (!bucket.baseSum) bucket.baseSum = { value: 0, unit: baseline.base_unit };
            bucket.baseSum.value += inBase;
          } else if (hasAmount) {
            bucket.unconvertible++;
          }
        } else if (hasAmount) {
          bucket.unconvertible++;
        }
      }
    }
  }

  const result: ShoppingList = {};
  for (const bucket of buckets.values()) {
    const item: ShoppingItem = {
      name: bucket.name,
      baselineId: bucket.baselineId,
      amounts: bucket.amounts,
      baseAmount: bucket.baseSum,
      combined: renderCombined(bucket),
      shopCategory: bucket.shopCategory,
      checked: false,
    };
    if (!result[bucket.shopCategory]) result[bucket.shopCategory] = [];
    result[bucket.shopCategory].push(item);
  }

  for (const cat of Object.keys(result)) {
    result[cat].sort((a, b) => a.name.localeCompare(b.name, 'de'));
  }
  return result;
}

function renderCombined(bucket: Bucket): string {
  if (bucket.amounts.length === 0) return '';
  if (bucket.amounts.length === 1) return bucket.amounts[0];
  // Alle Einträge konvertierbar → Summe in base_unit + Original-Detail
  if (bucket.baseSum && bucket.unconvertible === 0) {
    const total = formatBaseAmount(bucket.baseSum.value, bucket.baseSum.unit);
    return `${total} (${bucket.amounts.join(' + ')})`;
  }
  // Gemischt oder ohne Baseline → Legacy-Verhalten
  return combineAmountsLegacy(bucket.amounts);
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
