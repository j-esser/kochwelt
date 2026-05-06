import { matchIngredient } from '../services/ingredientBaseline';
import { BASELINE_INGREDIENTS } from '../constants/ingredientBaseline';

const cases = [
  '2 EL Olivenöl zum Anbraten',
  '1 dicke Möhre',
  'Salz nach Geschmack',
  '½ TL Kreuzkümmel',
  '200 g Hähnchenbrust',
  '3 Eier',
  '1 Dose Tomatenstücke',
  '2 Knoblauchzehen',
  '1 reife Avocado',
  '100 g Möhren, geschält',
  'etwas Olivenöl',
  '1 Bund frischer Petersilie',
  '200 ml Sahne',
  'Saft einer Zitrone',
  '500 g Hackfleisch',
  '1 Becher griechischer Joghurt',
  '40 g Parmesan, gerieben',
  '2 Esslöffel Crème fraîche',
  '1/2 Zwiebel',
];

console.log('PARSER SMOKE TEST');
console.log('=================');
let matched = 0;
for (const c of cases) {
  const m = matchIngredient(c, BASELINE_INGREDIENTS);
  const status = m.baselineId ? '✓' : '✗';
  if (m.baselineId) matched++;
  console.log(`${status} "${c}"`);
  console.log(
    `   q=${m.quantity ?? '-'} u=${m.unit ?? '-'} raw="${m.rawName}" → ${
      m.baselineId ?? 'UNKNOWN'
    } (${m.normalizedName ?? '-'})`,
  );
}
console.log(`\n${matched}/${cases.length} matched`);
