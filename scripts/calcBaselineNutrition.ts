// npx tsx scripts/calcBaselineNutrition.ts
// Berechnet Nährwerte für alle 40 Baseline-Rezepte aus den Zutaten und schreibt
// die Ergebnisse direkt in constants/baselineRecipes.ts zurück.

import * as fs from 'fs';
import * as path from 'path';
import { BASELINE_RECIPES } from '../constants/baselineRecipes';
import { BASELINE_INGREDIENTS } from '../constants/ingredientBaseline';
import {
  parseIngredientText,
  findBaselineMatch,
  calcNutritionFromMatches,
  type IngredientMatch,
} from '../services/ingredientBaseline';

const filePath = path.join(__dirname, '../constants/baselineRecipes.ts');
let content = fs.readFileSync(filePath, 'utf8');

let updatedCount = 0;
const rows: string[] = [];

for (const recipe of BASELINE_RECIPES) {
  const items: IngredientMatch[] = recipe.ingredients.map(ing => {
    const line = [ing.amount, ing.name].filter(Boolean).join(' ');
    const parsed = parseIngredientText(line);
    const match = findBaselineMatch(parsed.rawName, BASELINE_INGREDIENTS);
    if (match) return { ...parsed, baselineId: match.id, baseline: match, normalizedName: match.name };
    return parsed;
  });

  const n = calcNutritionFromMatches(items);
  const title = recipe.title.slice(0, 50).padEnd(50);
  rows.push(
    `${title} | kcal: ${String(n.kcal).padStart(4)} | P: ${String(n.protein).padStart(3)}g | F: ${String(n.fat).padStart(3)}g | KH: ${String(n.carbs).padStart(3)}g | skip: ${n.skippedCount}/${recipe.ingredients.length}`,
  );

  // Nutrition-Block in der Quelldatei ersetzen
  const idStr = `"id": "${recipe.id}"`;
  const idPos = content.indexOf(idStr);
  if (idPos === -1) continue;

  const nutLabel = '"nutrition": {';
  const nutPos = content.indexOf(nutLabel, idPos);
  if (nutPos === -1) continue;

  const openBrace = content.indexOf('{', nutPos + nutLabel.length - 1);
  const closeBrace = content.indexOf('}', openBrace + 1);
  if (openBrace === -1 || closeBrace === -1) continue;

  const newBlock = `\n      "kcal": ${n.kcal},\n      "protein": ${n.protein},\n      "fat": ${n.fat},\n      "carbs": ${n.carbs}\n    `;
  content = content.slice(0, openBrace + 1) + newBlock + content.slice(closeBrace);
  updatedCount++;
}

fs.writeFileSync(filePath, content, 'utf8');

console.log('─'.repeat(80));
console.log('Berechnete Nährwerte (gesamt, alle Portionen):');
console.log('─'.repeat(80));
rows.forEach(r => console.log(r));
console.log('─'.repeat(80));
console.log(`✅ ${updatedCount}/${BASELINE_RECIPES.length} Rezepte in baselineRecipes.ts aktualisiert`);
