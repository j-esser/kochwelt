// npx tsx scripts/exportBaselineForGist.ts [version]
//
// Generiert die JSON-Datei für den Baseline-Gist aus BASELINE_INGREDIENTS.
// Aufruf:
//   npx tsx scripts/exportBaselineForGist.ts          → Version 1, Datum heute
//   npx tsx scripts/exportBaselineForGist.ts 7        → Version 7, Datum heute
//
// Workflow:
//   1. constants/ingredientBaseline.ts editieren (neue Zutaten / Aliase / Korrekturen)
//   2. Dieses Script aufrufen — schreibt scripts/baseline-gist.json
//   3. Inhalt der JSON-Datei in den Gist pasten und committen
//   4. App holt sich beim nächsten Start automatisch die neue Version
//
// Wichtig: bei jedem Gist-Edit MUSS `version` inkrementiert werden, sonst erkennt
// die App das Update nicht.

import * as fs from 'fs';
import * as path from 'path';
import { BASELINE_INGREDIENTS } from '../constants/ingredientBaseline';
import { SUPPORTED_SCHEMA_VERSION } from '../services/baselineSync';

const versionArg = process.argv[2];
const version = versionArg ? parseInt(versionArg, 10) : 1;
if (isNaN(version) || version < 1) {
  console.error('❌ Ungültige Version. Erwartet eine positive Ganzzahl.');
  process.exit(1);
}

const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

const payload = {
  schemaVersion: SUPPORTED_SCHEMA_VERSION,
  version,
  updatedAt: today,
  ingredients: BASELINE_INGREDIENTS,
};

const outPath = path.join(__dirname, 'baseline-gist.json');
fs.writeFileSync(outPath, JSON.stringify(payload, null, 2) + '\n', 'utf8');

console.log('─'.repeat(60));
console.log(`✅ Gist-JSON exportiert: scripts/baseline-gist.json`);
console.log(`   Schema-Version: ${SUPPORTED_SCHEMA_VERSION}`);
console.log(`   Daten-Version:  ${version}`);
console.log(`   Datum:          ${today}`);
console.log(`   Zutaten:        ${BASELINE_INGREDIENTS.length}`);
console.log('─'.repeat(60));
console.log('Nächste Schritte:');
console.log('  1. scripts/baseline-gist.json öffnen und Inhalt kopieren');
console.log('  2. In den Baseline-Gist auf gist.github.com einfügen → Save');
console.log(`  3. Beim nächsten App-Start wird Version ${version} automatisch geladen`);
console.log('');
console.log('⚠️  Beim nächsten Edit: Version-Argument erhöhen!');
console.log(`    Aktuell: ${version}  →  nächstes Mal: ${version + 1}`);
