// Lokale Kategorie-Bilder für Rezepte ohne eigenes Foto.
//
// Anstatt 40 individuelle Unsplash-URLs zu hosten (die beim ersten App-Start
// nacheinander geladen werden und ANR verursachen), bündelt die App pro
// Kategorie 1-3 generische Beispielbilder direkt als Asset.
//
// Der Resolver wählt deterministisch (Hash über recipe.id) ein Bild aus dem
// Pool — gleiches Rezept bekommt immer dasselbe Bild, kein Flackern.
//
// HINWEIS zu Asset-IDs: Die `number`-Werte aus `require(...)` sind nur zur
// Render-Zeit gültig (Metro rotiert IDs bei jedem Build). Sie dürfen NICHT
// nach AsyncStorage geschrieben werden — siehe RecipeImage-Logik.

const PASTA_1       = require('../assets/recipe-photos/pasta-1.jpg');
const REIS_1        = require('../assets/recipe-photos/reis-1.jpg');
const CURRY_1       = require('../assets/recipe-photos/curry-1.jpg');
const SUPPE_1       = require('../assets/recipe-photos/suppe-1.jpg');
const FISCH_1       = require('../assets/recipe-photos/fisch-1.jpg');
const VEGETARISCH_1 = require('../assets/recipe-photos/vegetarisch-1.jpg');

// Kategorie → Bild-Pool. Mehrfach-Verwendung für Kategorien, für die wir noch
// kein eigenes Bild haben (Fleisch / Salat / Eintopf) — bewusste Wahl:
//   - Fleisch teilt sich das Reis-mit-Hähnchen-Bild
//   - Salat teilt sich das Vegetarisch-Bild (Bowl-Look)
//   - Eintopf teilt sich das Suppen-Bild
export const CATEGORY_PHOTOS: Record<string, number[]> = {
  'Pasta':       [PASTA_1],
  'Reis':        [REIS_1],
  'Curry':       [CURRY_1],
  'Suppe':       [SUPPE_1],
  'Fisch':       [FISCH_1],
  'Fleisch':     [REIS_1],
  'Vegetarisch': [VEGETARISCH_1],
  'Salat':       [VEGETARISCH_1],
  'Eintopf':     [SUPPE_1],
};

// Globaler Fallback, wenn keine Kategorie gesetzt ist oder unbekannt.
const FALLBACK_PHOTOS: number[] = [VEGETARISCH_1, PASTA_1];

/**
 * Liefert deterministisch ein lokales Asset für ein Rezept ohne eigenes Foto.
 *
 * @param recipeId stabile Rezept-ID — bestimmt via Hash, welches Bild aus dem
 *   Kategorie-Pool genommen wird (verhindert Flackern bei Re-Renders).
 * @param category erste Kategorie des Rezepts (oder undefined für Fallback-Pool)
 */
export function resolveCategoryPhoto(recipeId: string, category?: string): number {
  const pool = (category && CATEGORY_PHOTOS[category]) || FALLBACK_PHOTOS;
  return pool[simpleHash(recipeId) % pool.length];
}

function simpleHash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}
