// npx tsx scripts/addGiftRecipe.ts <recipe.json> <YYYY-MM-DD>
//
// Hängt ein Rezept als Geschenk an scripts/gifts-gist.json an, generiert eine
// stabile Gift-ID, bumpt die `version` und setzt `updatedAt` auf heute.
//
// recipe.json kann ein Recipe-Objekt sein ODER ein Array von Recipe-Objekten
// (kompatibel mit dem In-App-Export `exportSingleRecipeJSON`). Bei einem Array
// wird das erste Element verwendet.
//
// Workflow:
//   1. Rezept-Vorschlag aus GitHub-Issue / Mail / In-App-Export als JSON-Datei speichern
//   2. npx tsx scripts/addGiftRecipe.ts ~/Downloads/submission.json 2026-06-01
//   3. Inhalt von scripts/gifts-gist.json kopieren → in den Gift-Gist pasten → Save

import * as fs from 'fs';
import * as path from 'path';
import type { GiftEntry } from '../services/giftRecipes';
import type { Recipe } from '../services/recipeStore';

// Muss mit SUPPORTED_GIFT_SCHEMA_VERSION in services/giftRecipes.ts übereinstimmen.
// (Hier hardcoded, weil ein Wert-Import den gesamten React-Native-Modulgraph
// in das Script ziehen würde, was in Node nicht läuft.)
const SUPPORTED_GIFT_SCHEMA_VERSION = 1;

const [, , inputArg, dateArg] = process.argv;

if (!inputArg || !dateArg) {
  console.error('Usage: npx tsx scripts/addGiftRecipe.ts <recipe.json> <YYYY-MM-DD>');
  process.exit(1);
}
if (!/^\d{4}-\d{2}-\d{2}$/.test(dateArg)) {
  console.error(`❌ deliverAfter muss YYYY-MM-DD sein, nicht "${dateArg}".`);
  process.exit(1);
}

const inputPath = path.resolve(inputArg);
if (!fs.existsSync(inputPath)) {
  console.error(`❌ Datei nicht gefunden: ${inputPath}`);
  process.exit(1);
}

const raw = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
const recipe: Recipe = Array.isArray(raw) ? raw[0] : raw;

if (!recipe || typeof recipe.id !== 'string' || typeof recipe.title !== 'string') {
  console.error('❌ Eingabe enthält kein gültiges Rezept (id + title erforderlich).');
  process.exit(1);
}

// Lokale Foto-Pfade entfernen (wären bei Empfängern nicht erreichbar)
if (recipe.photo && !recipe.photo.startsWith('http')) {
  console.warn(`⚠️  Lokales Foto gefunden (${recipe.photo}) — wird entfernt. Falls gewünscht, vorher HTTPS-URL eintragen.`);
  delete recipe.photo;
}

// Stabile Gift-ID: g_<YYYY_MM>_<slug>
const slug = recipe.title
  .toLowerCase()
  .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
  .replace(/[^a-z0-9]+/g, '_')
  .replace(/^_+|_+$/g, '')
  .slice(0, 40);
const yearMonth = dateArg.slice(0, 7).replace('-', '_');
const giftId = `g_${yearMonth}_${slug}`;

const newGift: GiftEntry = { id: giftId, deliverAfter: dateArg, recipe };

// Manifest laden oder neu erstellen
const manifestPath = path.join(__dirname, 'gifts-gist.json');
let manifest: { schemaVersion: number; version: number; updatedAt: string; gifts: GiftEntry[] };
if (fs.existsSync(manifestPath)) {
  manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  // Duplikate prüfen
  if (manifest.gifts.some(g => g.id === giftId)) {
    console.error(`❌ Gift-ID "${giftId}" existiert bereits im Manifest. Anderen Titel/Datum wählen oder manuell editieren.`);
    process.exit(1);
  }
  manifest.version += 1;
  manifest.updatedAt = new Date().toISOString().slice(0, 10);
  manifest.gifts.push(newGift);
} else {
  manifest = {
    schemaVersion: SUPPORTED_GIFT_SCHEMA_VERSION,
    version: 1,
    updatedAt: new Date().toISOString().slice(0, 10),
    gifts: [newGift],
  };
}

fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n', 'utf8');

console.log('─'.repeat(60));
console.log(`✅ Geschenk hinzugefügt: ${recipe.title}`);
console.log(`   Gift-ID:      ${giftId}`);
console.log(`   deliverAfter: ${dateArg}`);
console.log(`   Manifest-Version: ${manifest.version} (${manifest.gifts.length} Geschenk${manifest.gifts.length !== 1 ? 'e' : ''})`);
console.log('─'.repeat(60));
console.log('Nächste Schritte:');
console.log('  1. scripts/gifts-gist.json öffnen, Inhalt komplett kopieren');
console.log('  2. In den Geschenk-Gist auf gist.github.com einfügen → Save');
console.log('  3. Beim nächsten App-Start (ggf. nach 6h-TTL) wird Version ' + manifest.version + ' geladen');
