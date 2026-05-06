/**
 * Audit-Script: prüft alle Zutaten der 40 Baseline-Rezepte gegen die
 * Ingredient-Baseline und schreibt einen Markdown-Report unter
 * scripts/baseline-audit.md.
 *
 * Aufruf: npx tsx scripts/auditBaselineIngredients.ts
 */
import * as fs from 'fs';
import * as path from 'path';
import { matchIngredient, parseIngredientText, findBaselineMatch } from '../services/ingredientBaseline';
import { BASELINE_INGREDIENTS } from '../constants/ingredientBaseline';
import { BASELINE_RECIPES } from '../constants/baselineRecipes';

interface UnmatchedEntry {
  rawName: string;
  recipes: string[];
  count: number;
  fuzzyCandidate?: string;
}

const lines: string[] = [];
const unmatchedMap = new Map<string, UnmatchedEntry>();

let totalIngredients = 0;
let totalMatched = 0;

lines.push('# Baseline-Audit-Report');
lines.push('');
lines.push(`Generated: ${new Date().toISOString()}`);
lines.push(`Recipes: ${BASELINE_RECIPES.length}, Baseline-Zutaten: ${BASELINE_INGREDIENTS.length}`);
lines.push('');
lines.push('---');
lines.push('');

for (const recipe of BASELINE_RECIPES) {
  lines.push(`## ${recipe.title}`);
  lines.push('');
  let recipeMatched = 0;
  for (const ing of recipe.ingredients) {
    totalIngredients++;
    const line = `${ing.amount} ${ing.name}`.trim();
    const m = matchIngredient(line, BASELINE_INGREDIENTS);
    if (m.baselineId) {
      recipeMatched++;
      totalMatched++;
      lines.push(`- ✅ \`${line}\` → **${m.normalizedName}** (\`${m.baselineId}\`)`);
    } else {
      // Try fuzzy candidate (looser): substring against any baseline word
      const stripped = m.rawName.toLocaleLowerCase('de-DE');
      let fuzzy: string | undefined;
      for (const b of BASELINE_INGREDIENTS) {
        const cands = [b.name, ...(b.aliases ?? [])].map(c => c.toLocaleLowerCase('de-DE'));
        for (const c of cands) {
          if (c.length >= 4 && (stripped.includes(c.slice(0, 4)) || c.includes(stripped.slice(0, 4)))) {
            fuzzy = b.name;
            break;
          }
        }
        if (fuzzy) break;
      }
      lines.push(`- ⚠️ \`${line}\`${fuzzy ? ` — Kandidat: **${fuzzy}**?` : ''}`);

      const key = m.rawName.toLocaleLowerCase('de-DE');
      const existing = unmatchedMap.get(key);
      if (existing) {
        existing.count++;
        if (!existing.recipes.includes(recipe.title)) existing.recipes.push(recipe.title);
      } else {
        unmatchedMap.set(key, {
          rawName: m.rawName,
          recipes: [recipe.title],
          count: 1,
          fuzzyCandidate: fuzzy,
        });
      }
    }
  }
  const pct = recipe.ingredients.length > 0
    ? Math.round((recipeMatched / recipe.ingredients.length) * 100)
    : 0;
  lines.push('');
  lines.push(`*${recipeMatched}/${recipe.ingredients.length} matched (${pct} %)*`);
  lines.push('');
}

lines.push('---');
lines.push('');
lines.push('## Aggregate: Unmatched Zutaten');
lines.push('');
lines.push(`**Total Match-Rate**: ${totalMatched}/${totalIngredients} = ${Math.round((totalMatched / Math.max(1, totalIngredients)) * 100)} %`);
lines.push('');

const sorted = Array.from(unmatchedMap.values()).sort((a, b) => b.count - a.count);

lines.push('| # | Roh-Name | Vorkommen | Fuzzy-Kandidat | Rezepte |');
lines.push('|---|---|---|---|---|');
for (const u of sorted) {
  lines.push(
    `| ${u.count} | \`${u.rawName}\` | ${u.count} | ${u.fuzzyCandidate ?? '–'} | ${u.recipes.slice(0, 3).join(', ')}${u.recipes.length > 3 ? ` (+${u.recipes.length - 3})` : ''} |`,
  );
}

const outPath = path.join(__dirname, 'baseline-audit.md');
fs.writeFileSync(outPath, lines.join('\n'), 'utf8');

console.log(`Audit-Report geschrieben: ${outPath}`);
console.log(`Match-Rate: ${totalMatched}/${totalIngredients} = ${Math.round((totalMatched / Math.max(1, totalIngredients)) * 100)} %`);
console.log(`Unbekannte (unique): ${unmatchedMap.size}`);
