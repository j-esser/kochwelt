import { BASELINE_INGREDIENTS, BaselineIngredient } from '@/constants/ingredientBaseline';

const FRACTIONS: Record<string, number> = {
  '½': 0.5,
  '¼': 0.25,
  '¾': 0.75,
  '⅓': 1 / 3,
  '⅔': 2 / 3,
};

const UNIT_NORMALIZE: Record<string, string> = {
  esslöffel: 'EL',
  teelöffel: 'TL',
  el: 'EL',
  tl: 'TL',
};

const KNOWN_UNITS = [
  'g', 'kg', 'ml', 'l', 'EL', 'TL',
  'Esslöffel', 'Teelöffel', 'Prise', 'Bund',
  'Dose', 'Stück', 'Scheibe', 'Zehe', 'Tasse',
  'Packung', 'Päckchen', 'Becher', 'Schuss', 'Abtropfgewicht',
];
const UNIT_REGEX = new RegExp(`^(${KNOWN_UNITS.join('|')})\\b\\s*(.*)$`, 'i');

const FILLERS: RegExp[] = [
  /\s*\([^)]*\)\s*/g,
  /,\s.+$/,
  /\s+zum\s+\S+$/i,
  /\s+frisch\s+\S+$/i,
  /\s+(fein|grob|klein)\s+\S+$/i,
  /\s+in\s+\S+$/i,
  /\s+gewürfelt$/i,
  /\s+geschält$/i,
  /\s+geputzt$/i,
  /\s+gepresst$/i,
  /\s+geschnitten$/i,
  /\s+gerieben$/i,
  /\s+gehackt$/i,
  /\s+extra\s+vergine$/i,
  /^ca\.\s*/i,
  /^etwas\s+/i,
];

const QUANTITY_REGEX = /^([\d.,½¼¾⅓⅔]+(?:\s*[\d.,½¼¾⅓⅔/]+)?)\s*(.*)$/;

export interface IngredientMatch {
  baselineId?: string;
  baseline?: BaselineIngredient;
  rawName: string;
  normalizedName?: string;
  quantity?: number;
  unit?: string;
}

function parseQuantityToken(token: string): number | null {
  let s = token.trim().replace(',', '.');
  for (const [f, v] of Object.entries(FRACTIONS)) {
    if (s.includes(f)) s = s.replace(f, String(v));
  }
  if (s.includes('/')) {
    const parts = s.split(/\s+/);
    let total = 0;
    for (const p of parts) {
      const slash = p.indexOf('/');
      if (slash > 0) {
        const num = parseFloat(p.slice(0, slash));
        const den = parseFloat(p.slice(slash + 1));
        if (!isNaN(num) && !isNaN(den) && den !== 0) total += num / den;
        else return null;
      } else {
        const v = parseFloat(p);
        if (isNaN(v)) return null;
        total += v;
      }
    }
    return total;
  }
  const v = parseFloat(s);
  return isNaN(v) ? null : v;
}

function stripFillers(name: string): string {
  let s = name.trim();
  for (const re of FILLERS) s = s.replace(re, '');
  return s.trim().replace(/\s+/g, ' ').replace(/[.,;:]+$/, '');
}

function normalizeUnit(unit: string | undefined): string | undefined {
  if (!unit) return undefined;
  const lower = unit.trim().toLocaleLowerCase('de-DE');
  return UNIT_NORMALIZE[lower] ?? unit.trim();
}

export function parseIngredientText(line: string): IngredientMatch {
  const s = line.trim().replace(/^[-•*]\s*/, '');
  let quantity: number | undefined;
  let unit: string | undefined;
  let rest = s;

  const m = s.match(QUANTITY_REGEX);
  if (m) {
    const q = parseQuantityToken(m[1]);
    if (q !== null) {
      quantity = q;
      rest = m[2];
      const u = rest.match(UNIT_REGEX);
      if (u) {
        unit = normalizeUnit(u[1]);
        rest = u[2];
      }
    }
  }

  const rawName = rest.trim();
  return { rawName, quantity, unit };
}

// Index-Cache pro Baseline-Referenz. Rebuild nur, wenn ein neuer Array-Identity
// reinkommt (z.B. nach Remote-Cache-Update via baselineSync). Innerhalb einer
// Migration mit ~400 Aufrufen wird sonst der Index 400× gebaut — bei zehntausenden
// Regex-Kompilierungen pro Aufruf ist das der Hauptkostenfaktor des Cold Starts.
type FuzzyCandidate = { regex: RegExp; len: number };
type FuzzyEntry = { b: BaselineIngredient; candidates: FuzzyCandidate[] };

let _exactIndex: Map<string, BaselineIngredient> | null = null;
let _fuzzyTable: FuzzyEntry[] | null = null;
let _lastBaselineRef: BaselineIngredient[] | null = null;

function ensureIndexes(baseline: BaselineIngredient[]): void {
  if (_lastBaselineRef === baseline && _exactIndex) return;
  const exact = new Map<string, BaselineIngredient>();
  const fuzzy: FuzzyEntry[] = [];
  for (const b of baseline) {
    const candidates: FuzzyCandidate[] = [];
    const allNames = [b.name, ...(b.aliases ?? [])];
    for (const c of allNames) {
      const lower = c.toLocaleLowerCase('de-DE');
      // Exakt-Match-Index: bei doppelten Aliases gewinnt die erste Baseline
      if (!exact.has(lower)) exact.set(lower, b);
      const escaped = lower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      candidates.push({
        regex: new RegExp(`(?:^|\\s)${escaped}(?:$|\\s|n\\b|en\\b|er\\b)`),
        len: lower.length,
      });
    }
    fuzzy.push({ b, candidates });
  }
  _exactIndex = exact;
  _fuzzyTable = fuzzy;
  _lastBaselineRef = baseline;
}

export function findBaselineMatch(
  rawName: string,
  baseline: BaselineIngredient[],
): BaselineIngredient | undefined {
  const stripped = stripFillers(rawName).toLocaleLowerCase('de-DE');
  if (!stripped) return undefined;

  ensureIndexes(baseline);

  // 1) Exakt-Match auf Name oder Alias — O(1)
  const hit = _exactIndex!.get(stripped);
  if (hit) return hit;

  // 2) Fuzzy-Substring mit pre-compiled Regexes — längster Treffer gewinnt
  let best: { b: BaselineIngredient; len: number } | undefined;
  for (const entry of _fuzzyTable!) {
    for (const cand of entry.candidates) {
      if (cand.regex.test(stripped) && (!best || cand.len > best.len)) {
        best = { b: entry.b, len: cand.len };
      }
    }
  }
  return best?.b;
}

export function matchIngredient(line: string, baseline: BaselineIngredient[]): IngredientMatch {
  const parsed = parseIngredientText(line);
  const m = findBaselineMatch(parsed.rawName, baseline);
  if (m) return { ...parsed, baselineId: m.id, baseline: m, normalizedName: m.name };
  return parsed;
}

export function bundledBaseline(): BaselineIngredient[] {
  return BASELINE_INGREDIENTS;
}

export interface NutritionCalcResult {
  kcal: number;
  protein: number;
  fat: number;
  carbs: number;
  skippedCount: number;
}

export function resolveAmountInBase(
  quantity: number,
  unit: string | undefined,
  b: BaselineIngredient,
): number | null {
  // Bereits in base_unit
  if (unit === b.base_unit) return quantity;
  // Masse/Volumen-Konvertierung
  if (unit === 'kg' && b.base_unit === 'g') return quantity * 1000;
  if (unit === 'l' && b.base_unit === 'ml') return quantity * 1000;
  // Benannte Einheiten-Tabelle (EL, TL, Dose, Becher …)
  if (unit && b.default_weight_per_unit?.[unit] != null) {
    return quantity * b.default_weight_per_unit[unit];
  }
  // Gezählt (kein Unit oder explizites 'Stück')
  if (!unit || unit === 'Stück') {
    if (b.base_unit === 'Stück') return quantity;
    if (b.default_weight_per_piece != null) return quantity * b.default_weight_per_piece;
  }
  return null;
}

export function formatBaseAmount(value: number, unit: 'g' | 'ml' | 'Stück'): string {
  const num = (n: number) => Number.isInteger(n) ? String(n) : String(Math.round(n * 10) / 10);
  if (unit === 'Stück') return `${Math.round(value)} Stück`;
  if (unit === 'g' && value >= 1000) return `${num(value / 1000)} kg`;
  if (unit === 'ml' && value >= 1000) return `${num(value / 1000)} l`;
  return `${num(value)} ${unit}`;
}

export function calcNutritionFromMatches(items: IngredientMatch[]): NutritionCalcResult {
  let kcal = 0, protein = 0, fat = 0, carbs = 0, skippedCount = 0;
  for (const item of items) {
    const { baseline: b, quantity, unit } = item;
    if (!b || quantity == null) { skippedCount++; continue; }
    const nutrients = b.nutrients_per_100g ?? b.nutrients_per_100ml;
    if (!nutrients) { skippedCount++; continue; }
    const amount = resolveAmountInBase(quantity, unit, b);
    if (amount == null || amount <= 0) { skippedCount++; continue; }
    kcal    += amount * nutrients.calories / 100;
    protein += amount * nutrients.protein  / 100;
    fat     += amount * nutrients.fat      / 100;
    carbs   += amount * nutrients.carbs    / 100;
  }
  return { kcal: Math.round(kcal), protein: Math.round(protein), fat: Math.round(fat), carbs: Math.round(carbs), skippedCount };
}

export function calcNutritionFromIngredients(
  ingredients: Array<{ parsedQuantity?: number; parsedUnit?: string; baselineId?: string }>,
  baseline: BaselineIngredient[],
): NutritionCalcResult {
  const byId = new Map(baseline.map(b => [b.id, b]));
  const items: IngredientMatch[] = ingredients.map(ing => ({
    rawName: '',
    quantity: ing.parsedQuantity,
    unit: ing.parsedUnit,
    baselineId: ing.baselineId,
    baseline: ing.baselineId ? byId.get(ing.baselineId) : undefined,
  }));
  return calcNutritionFromMatches(items);
}

export function makeUserIngredientId(name: string): string {
  return (
    'u_' +
    name
      .trim()
      .toLocaleLowerCase('de-DE')
      .replace(/ä/g, 'ae')
      .replace(/ö/g, 'oe')
      .replace(/ü/g, 'ue')
      .replace(/ß/g, 'ss')
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 40)
  );
}
