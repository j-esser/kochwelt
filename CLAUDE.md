# CLAUDE.md — Kochwelt

Referenz für Claude Code. Wird bei jeder Session automatisch geladen.

---

## Projekt

Persönliche Rezept- und Meal-Planning-App (iOS/Android/Web), entwickelt mit Expo (React Native).

- **Pfad lokal**: `/Users/jurgenesser/Desktop/kochwelt/`
- **GitHub**: `git@github.com:j-esser/kochwelt.git`
- **Stack**: Expo SDK 55, React Native, Expo Router, NativeWind v4, AsyncStorage
- **Sprache**: TypeScript, Deutsch (UI + Kommentare)

---

## Entwicklung starten

```bash
cd /Users/jurgenesser/Desktop/kochwelt
npx expo start --web        # Web-Vorschau (funktioniert immer)
npx expo start              # Dann 'i' für iOS Simulator (benötigt Xcode)
```

> Expo Go läuft nicht auf iOS 26.3.1 — iOS Simulator via Xcode verwenden.

---

## Architektur

### Navigation (Expo Router, file-based)

```
app/
  (tabs)/
    index.tsx         # Startseite: Begrüßung, Statistiken, Rezept des Tages
    rezepte.tsx       # Rezeptliste: Suche, Kategorie-Filter, kcal-Badge
    planer.tsx        # Wochenplaner: 7 Tage, Mittag/Abend-Slots
    two.tsx           # Einkaufsliste (aus Wochenplan generiert)
    einstellungen.tsx # Einstellungen: Tipps & Tricks, Wochenplaner-Defaults, Erinnerungen, Nährwertziele, Browser-Import-Hinweis
    _layout.tsx       # Tab-Navigation Konfiguration
  recipe/
    [id].tsx          # Detailansicht: Zutaten, Nährwerte, Rating, Portionsskalierung, Einzel-JSON-Export
    new.tsx           # Neues Rezept — liest optionalen ?importUrl= Query-Param
    edit/[id].tsx     # Rezept bearbeiten
    pick.tsx          # Modal: Rezept aus Liste auswählen (für Planer)
  tools.tsx           # Export/Import JSON (alle Rezepte)
  _layout.tsx         # Root-Layout: seedIfEmpty, patchBaselineIngredients, patchBaselinePhotos
```

### Services

| Datei | Zuständigkeit |
|---|---|
| `services/recipeStore.ts` | Rezept-CRUD (AsyncStorage), Foto-Handling, Seed, Migrationen, `exportSingleRecipeJSON()` |
| `services/plannerStore.ts` | Wochenplan lesen/schreiben |
| `services/shoppingList.ts` | Einkaufsliste aufbauen (baseline-bewusst), `scaleAmount()`, `shoppingListToICS()` |
| `services/nutritionGoals.ts` | Nährwertziele (Tagesziele, AsyncStorage) |
| `services/recipePicker.ts` | Callback-Brücke Planer ↔ Picker-Modal |
| `services/settingsStore.ts` | App-Einstellungen, Benachrichtigungen, `defaultPlannerPortions` |
| `services/tips.ts` | Zentrale Tipp-Liste (`TIPS`), `tipsFor(context)`, `allVisibleTips()`, plattform-Filter |
| `services/ingredientBaseline.ts` | Parser, Matcher, Nährwert-Berechnung, Mengen-Konvertierung (`parseIngredientText`, `findBaselineMatch`, `matchIngredient`, `resolveAmountInBase`, `formatBaseAmount`, `calcNutritionFromMatches`, `calcNutritionFromIngredients`) |
| `services/userIngredients.ts` | Persistenz für Nutzer-eigene Zutaten (`loadBaseline()`, `addUserIngredients()`) — merged Remote-Cache (falls vorhanden) ODER Bundle + AsyncStorage |
| `services/baselineSync.ts` | Gist-Sync für die Zutaten-Baseline. `syncBaselineIfNeeded()` (TTL 6h, fire-and-forget), `syncBaselineNow()` (manuell), `getCachedRemoteBaseline()`, `getBaselineSyncStatus()` |

### Komponenten

| Datei | Zuständigkeit |
|---|---|
| `components/RecipeForm.tsx` | Formular für Erstellen/Bearbeiten + URL-/Vorlage-/JSON-Import + Baseline-Chips + Nährwert-Auto-Berechnung |
| `components/RecipeImage.tsx` | Bild mit Fallback auf `food-fallback.jpg` |
| `components/TipButton.tsx` | `?`-Icon (`help-circle-outline`), öffnet `TipModal` für einen Kontext |
| `components/TipModal.tsx` | Bottom-Sheet mit Tipps (Cream-Orange-Boxen) |
| `components/UnknownIngredientsModal.tsx` | Sammel-Dialog beim Speichern: pro unbekannter Zutat Name/Kategorie/Nährwerte pflegen → Eintrag in `kochwelt_user_ingredients` |

### Datenmodell (AsyncStorage-Key: `kochwelt_recipes`)

```typescript
interface Recipe {
  id: string;           // "r_<timestamp>_<random>" oder Baseline-ID
  title: string;
  categories: string[];
  description: string;
  cookTime: number;     // Minuten
  portions: number;
  reference: string;    // URL oder Buchquelle
  ingredients: Ingredient[];
  nutrition: { kcal, protein, fat, carbs: number | null };
  photo?: string;       // lokaler Pfad (file://) oder https-URL
  rating?: number;      // persönliche Bewertung 1–5
}

interface Ingredient {
  name: string;
  amount: string;            // "200 g", "2 EL", "½ TL" — unicode-Brüche erlaubt
  shopCategory: string;
  baselineId?: string;       // Referenz auf BaselineIngredient.id, gesetzt vom Parser
  parsedQuantity?: number;   // numerische Menge, z.B. 200
  parsedUnit?: string;       // normalisierte Einheit, z.B. "g", "EL"
}
```

### Einkaufskategorien (feste Reihenfolge)

```
Gemüse & Obst | Fleisch & Fisch | Mopro | Trockensortiment | Tiefkühl | Vorrat | Sonstiges
```

### Rezept-Kategorien (Tab-Filter)

```
Alle | Pasta | Reis | Curry | Suppe | Fisch | Fleisch | Vegetarisch | Salat | Eintopf | Ohne Kategorie
```

---

## Migrations-Mechanismus

Beim App-Start (`app/_layout.tsx`) werden drei Funktionen sequenziell aufgerufen:

1. **`seedIfEmpty()`** — lädt 40 Basis-Rezepte beim allerersten Start
2. **`patchBaselineIngredients()`** — überschreibt `ingredients` + `portions` + `nutrition` aller Baseline-Rezepte wenn `INGREDIENTS_VERSION` veraltet. **Reichert dabei jede Zutat über `matchIngredient()` an** — setzt `baselineId`, `parsedQuantity`, `parsedUnit` und übernimmt `shopCategory` aus der Baseline.
3. **`patchBaselinePhotos()`** — aktualisiert Foto-URLs wenn `PHOTO_VERSION` veraltet

**Versionsnummern in `recipeStore.ts` erhöhen um Migration auszulösen.** Aktuell: `INGREDIENTS_VERSION = '5'`, `PHOTO_VERSION = '4'`.

---

## Basis-Rezepte (`constants/baselineRecipes.ts`)

- 40 Rezepte, versioniert migrierbar
- IDs sind stabile Strings — **nie ändern**, sie sind Schlüssel für Migrationen und BASELINE_PHOTO_MAP
- Nutzer-eigene Rezepte (`r_<timestamp>_<random>`) werden von Migrationen nicht berührt

---

## Wichtige Implementierungsdetails

### Portionsskalierung — `app/recipe/[id].tsx`
- `scaledPortions` ist lokaler State (nicht gespeichert)
- `factor === 1` → Original anzeigen (verhindert Rounding-Artefakte bei "Prise Salz" etc.)
- `scaleAmount(amount, factor)` in `shoppingList.ts` — parst unicode-Brüche, gibt Original zurück wenn unparsierbar

### Rating — `services/recipeStore.ts`
- `setRecipeRating(id, rating | undefined)` — gleicher Stern nochmal → `undefined` (Toggle-Logik)
- Gespeichert direkt auf dem Recipe-Objekt

### Einkaufsliste teilen — `app/(tabs)/two.tsx`
- „Teilen"-Button öffnet **Action Sheet** (iOS) / **Alert** (Android) mit zwei Optionen:
  - **Als Text**: `Share.share()` → formatierter Klartext für WhatsApp, Mail etc.
  - **Als Erinnerung**: `shoppingListToICS()` → `.ics`-Datei → `Sharing.shareAsync()` → iOS Reminders via AirDrop

### Browser-Import / Deep Link — `components/RecipeForm.tsx`
- **Clipboard-Erkennung**: Beim Öffnen von „Neues Rezept" wird die Zwischenablage geprüft. Liegt eine gültige URL dort, wird per Alert angeboten, das Rezept sofort zu importieren. Kein Setup nötig.
- **Deep Link**: `kochwelt://recipe/new?importUrl=<encoded-url>` öffnet das Formular und startet den Import automatisch (mit Lade-Overlay). Wird von `new.tsx` via `useLocalSearchParams` gelesen.
- **Android**: Intent Filter in `app.json` für `SEND / text/plain` → Kochwelt erscheint nativ im Android Share Sheet
- **iOS**: Kein nativer Share-Sheet-Eintrag ohne Share Extension. Clipboard-Flow ist der empfohlene Weg. Share Extension ist für eine spätere Version geplant.

### Vorlage-/Import-Modal — `components/RecipeForm.tsx`
Klick auf „JSON / Vorlage" im Import-Bereich öffnet ein Bottom-Sheet-Modal mit drei Optionen:
- **Beispiel-Vorlage**: Füllt das Formular mit Dummy-Daten (Titel, Zutaten, Zubereitung, Nährwerte, Kategorie). Konstant `RECIPE_TEMPLATE` in `RecipeForm.tsx`.
- **Aus vorhandenem Rezept**: Zeigt eine durchsuchbare Liste aller Rezepte (`getAllRecipes()`). Bei Klick werden alle Felder vorbelegt (Titel mit „(Kopie)"-Suffix), ohne `id`/`photo`/`rating` — das wird beim Speichern ein neues Rezept.
- **JSON-Datei importieren**: Bestehender DocumentPicker-Flow (Web-App-Export-JSON).

State: `showTemplateModal`, `templateMode: 'choose'|'pickRecipe'`, `allRecipes`, `recipeSearch`. `applyImport()` setzt jetzt auch `protein/fat/carbs`.

### Tastatur-Behandlung — `react-native-keyboard-aware-scroll-view`
- Wird in `RecipeForm.tsx` und `app/(tabs)/einstellungen.tsx` verwendet (`KeyboardAwareScrollView` statt `ScrollView`).
- Bei multiline-`TextInput`s (Zutaten, Zubereitung) zusätzlich `onContentSizeChange` + `onFocus` mit `scrollToFocusedInput(node, 120, 0)` über Refs — nötig weil die Lib nicht von alleine auf wachsenden Cursor reagiert.
- Snack-/Kalte-Küche-Modal in `planer.tsx` nutzt `KeyboardAvoidingView` mit `behavior='padding'`, `justifyContent: 'flex-end'`, `pointerEvents: 'box-none'` — Backdrop ist `StyleSheet.absoluteFillObject`.

### Tagesziel-Berechnung — `app/(tabs)/planer.tsx::calcDayNutrition`
**Konvention**: Pro geplanter Mahlzeit zählt **immer 1 Portion** zum Tagesziel — `factor = 1 / (recipe.portions || 1)`. `meal.portions` (Picker) ist nur für die Einkaufsliste relevant (= „wie viele Portionen kochen"). Manuelle Einträge (Snack/Kalte Küche): `manualNutrition` wird direkt addiert; Werte gelten als „pro Portion" — Hinweis im Modal.

### Mahlzeit-Typ-Wähler im Snack-/Kalte-Küche-Modal — `planer.tsx`
Chips für Frühstück/Mittag/Abend/Snack. Bei Auswahl werden kcal/Protein/Fett/KH aus `getMealDefaults(goals, type)` (in `nutritionGoals.ts`) vorbelegt — Tagesziele × konfiguriertem Anteil (`splits.frueh|mittag|abend|sonst`). Default-Auswahl je nach Einstiegspunkt: Mittag-Slot → 'mittag', Abend-Slot → 'abend', „Snack hinzufügen" → 'sonst'.

### Foto-Handling
- Lokale Fotos: `FileSystem.documentDirectory + 'recipe_photos/' + recipeId + '.jpg'`
- Baseline-Fotos: https-URLs aus `BASELINE_PHOTO_MAP`
- Default-Foto für neue Rezepte: HTTPS-URL (Unsplash) → `RecipeForm.handleSave` ruft `saveRecipePhoto` **nur** für `file://`-URIs auf, sonst wird die URI direkt als `photo` übernommen. Wichtig: HTTPS-URL durch `copyAsync` würde sonst werfen und das Speichern komplett abbrechen.
- `RecipeImage.tsx`: Fallback auf `assets/images/food-fallback.jpg`
- Web: FileSystem nicht verfügbar → Foto-Upload deaktiviert
- Listen-Cards (`rezepte.tsx`, `pick.tsx`) verwenden **fixe Höhe** (`height: 180` / `160`) statt `aspectRatio`, damit Hochkant-Fotos das Layout nicht sprengen.

### Einzel-Rezept teilen — `app/recipe/[id].tsx`
- Header-Icon `share-outline` → `handleShareRecipe()`: schreibt `Kochwelt-<slug>.json` ins Cache und ruft `Sharing.shareAsync` auf (Mail/AirDrop/Nachrichten/Dateien-App).
- JSON kommt aus `exportSingleRecipeJSON(recipe)` (Array-Wrapper, Foto entfernt) — kompatibel mit `importRecipesJSON()`.
- Web-Fallback: direkter Blob-Download.

### Hilfe-/Tipp-System — `services/tips.ts` + `components/TipButton.tsx` + `components/TipModal.tsx`
- Zentrale Liste in `TIPS[]` mit `id`, `context`, `icon`, `title`, `body`, optional `platform: 'ios' | 'android' | 'all'`.
- `<TipButton context="..." />` rendert ein `?`-Icon (`help-circle-outline`); öffnet ein Bottom-Sheet-Modal mit allen Tipps für diesen Kontext (plattform-gefiltert). Komponente rendert `null`, wenn keine Tipps für Kontext + Plattform existieren.
- Eingebaut in: RecipeForm (Zutaten + Zubereitung + Import-Box), Detail-Header, Rezeptlisten-Header, Planer-Header, Shopping-Header (beide Varianten).
- Zentrale Übersicht in `einstellungen.tsx`: Sektion **„Tipps & Tricks"** ganz oben — gruppiert nach `CONTEXT_LABELS`, Aufklapp-Pattern (kein Modal-Overhead), nutzt `allVisibleTips()`.
- Neue Tipps: nur Eintrag in `TIPS[]` ergänzen — kein UI-Code nötig.

### Wochenplaner-Defaults — `services/settingsStore.ts`
- `AppSettings.defaultPlannerPortions` (default `2`): Standard-Portionen, die beim Hinzufügen einer Mahlzeit zum Planer vorbelegt werden.
- Ausgelesen in `app/recipe/pick.tsx` (Picker-Karte), `app/recipe/[id].tsx` (Zum-Planer-Modal), `app/(tabs)/planer.tsx` (Snack/Kalte-Küche-Modal).
- `DEFAULT_SETTINGS.reminderFrequency` ist `'weekly'` — bei Bestandsdaten greift der Wert nur, wenn das Setting noch nie gespeichert wurde (Merge mit Stored-Settings in `getSettings()`).

### Wochenplan
- Key-Format: `"YYYY-MM-DD"`
- Slots: `mittag` | `abend`
- `meal.recipeId` kann `undefined` sein (Kalte Küche / manueller Eintrag) — **immer prüfen vor Zugriff**

### Ingredient-Baseline — `constants/ingredientBaseline.ts` + `services/ingredientBaseline.ts`
**Konzept**: Zentrale Zutaten-Datenbank (~100 Einträge) mit ID, Name, Aliasen, Einkaufskategorie, Basis-Einheit (`g`/`ml`/`Stück`), Standard-Gewicht je Stück, Einheiten-Tabelle (`{EL: 15, TL: 5, Dose: 400}`) und Nährwerten je 100g/100ml. Jede Rezept-Zutat referenziert über `baselineId` einen Eintrag.

**Parser** (`parseIngredientText`): zerlegt Strings wie „2 EL Olivenöl zum Anbraten" in `{quantity: 2, unit: 'EL', rawName: 'Olivenöl'}`. Versteht Brüche (`½¼¾⅓⅔`), normalisiert Einheiten (`Esslöffel` → `EL`), strippt Floskeln (`zum Anbraten`, `fein gehackt`, `extra vergine`).

**Matcher** (`findBaselineMatch`): Exakt-Match auf Name → Aliase → Fuzzy-Substring mit Wortgrenz-Regex `(?:^|\s)wort(?:$|\s|n\b|en\b|er\b)` → längster Treffer gewinnt.

**Mengen-Konvertierung** (`resolveAmountInBase`): rechnet eine Menge mit Einheit in die `base_unit` der Baseline um. `kg`→`g×1000`, `l`→`ml×1000`, benannte Einheiten via `default_weight_per_unit`, gezählte Items (`!unit` oder `'Stück'`) via `default_weight_per_piece`. Liefert `null` wenn nicht konvertierbar.

**Anzeige** (`formatBaseAmount`): `1500 g` → `"1.5 kg"`, `1200 ml` → `"1.2 l"`, sonst Originaleinheit.

**Nährwert-Berechnung** (`calcNutritionFromMatches` / `calcNutritionFromIngredients`): summiert `quantity_in_base × nutrients_per_100 / 100` über alle Zutaten. Berechnet Totals für das gesamte Rezept (alle Portionen). Zutaten ohne Match oder ohne konvertierbare Einheit werden im `skippedCount` mitgezählt.

**Eigene Zutaten** (`services/userIngredients.ts`): User-Eingaben aus `UnknownIngredientsModal` werden in AsyncStorage (`kochwelt_user_ingredients`) persistiert und zur Bundle-Baseline gemerged. `loadBaseline()` liefert die kombinierte Liste.

### RecipeForm — Zutaten-Workflow
- `parseIngredients(text, baseline)`: pro Zeile → `matchIngredient` → `Ingredient` mit `baselineId`, `parsedQuantity`, `parsedUnit`. **Multi-Line-Format**: Reine Mengenzeilen (z.B. „75 g") werden mit der Folgezeile zusammengeführt; Anmerkungen wie „à ca. 200 g" oder Adjektiv-Zeilen (Kleinbuchstabe-Start) werden übersprungen.
- **Chip-Anzeige**: `parsedItems` (useMemo aus `ingredientsText`) → grüne ✅-Chips für Match, gelbe ⚠️-Chips für unbekannt. Hinweis-Box bei `unknownCount > 0`.
- **Sammel-Modal beim Speichern**: bei `unknownItems.length > 0` öffnet `UnknownIngredientsModal`. Bestätigen → `addUserIngredients()` → `parseIngredients` mit aktualisierter Baseline neu → `saveRecipe`.
- **„Aus Zutaten berechnen"-Button**: ruft `calcNutritionFromIngredients(parsedItems, baseline)` → Alert mit Vorschau + Abdeckung („X/Y Zutaten erkannt") → bei „Übernehmen" werden `kcal`/`protein`/`fat`/`carbs`-State-Felder gesetzt. Manuelle Werte werden NIE ohne Klick überschrieben.

### Einkaufsliste — Baseline-bewusste Aggregation (`services/shoppingList.ts`)
- **Merge-Schlüssel**: `ingredient.baselineId ?? name.toLowerCase().trim()`. Bei Match werden Display-Name und Einkaufskategorie aus der Baseline übernommen.
- **On-the-fly-Match**: Zutaten ohne `baselineId` (z.B. aus eigenen Rezepten ohne Migration) werden beim Bauen der Liste über `matchIngredient` nachträglich gematcht. Garantiert konsistente Aggregation auch ohne explizite Migration.
- **Mengen-Summierung**: `parsedQuantity × factor` wird über `resolveAmountInBase` in `base_unit` umgerechnet. Bei vollständig konvertierbaren Einträgen → `"430 ml (2 EL + 100 ml + 1 Schuss)"`. Bei mindestens einem nicht-konvertierbaren Eintrag → Legacy-Fallback (`combineAmountsLegacy`, summiert nur identische Unit-Strings).
- **Fortschritt**: `ShoppingItem` hat zusätzlich `baselineId?` und `baseAmount?: { value, unit }` für mögliche zukünftige UI-Erweiterungen.

### Fuse.js — Tippfehler-tolerante Suche
- Eingebaut in [rezepte.tsx](app/(tabs)/rezepte.tsx), [pick.tsx](app/recipe/pick.tsx), [RecipeForm.tsx](components/RecipeForm.tsx) (Vorlagen-Picker)
- Konfiguration: `threshold: 0.35`, `ignoreLocation: true`, `minMatchCharLength: 2`
- Gewichtete Keys: Titel ×3, Zutaten-Name ×2, Description ×1, Kategorien ×1
- Fuse-Index per `useMemo([recipes])` — wird nicht bei jedem Render neu gebaut
- Suchergebnisse werden als `Set<id>` über das bestehende Filter-Pipeline (Tab → Search → Smart Filter) gelegt

### Baseline-Sync (Phase 4) — `services/baselineSync.ts`
**Idee**: Die Zutaten-Baseline lebt zusätzlich im GitHub-Gist. Damit lassen sich Korrekturen / neue Aliase / Nährwert-Anpassungen ausrollen, **ohne** ein App-Release zu machen. Die App lädt beim Start im Hintergrund (max. einmal alle 6h) das Gist und vergleicht die `version`-Zahl im JSON mit dem Cache.

**Datenquellen-Hierarchie in `loadBaseline()`** (`services/userIngredients.ts`):
1. **Remote-Cache** (`getCachedRemoteBaseline()`) — wenn vorhanden, ersetzt das Bundle vollständig
2. **Bundle** (`bundledBaseline()`) — Fallback bei Erstinstallation oder Offline-Failure
3. **User-Einträge** (`loadUserIngredients()`) — werden NIEMALS modifiziert oder gelöscht, immer on-top gemerged

**Gist-Format** (`scripts/baseline-gist.json`):
```json
{ "schemaVersion": 1, "version": 7, "updatedAt": "2026-05-07", "ingredients": [...] }
```
- `schemaVersion`: aktuell `1`. Bei Format-Änderungen erhöhen — App verwirft Update bei Mismatch.
- `version`: integer, MUSS bei jedem Gist-Edit inkrementiert werden, sonst greift kein Update.
- `updatedAt`: rein informativ, in Settings angezeigt.

**Sync-Trigger**:
- Beim App-Start (`app/_layout.tsx`): `syncBaselineIfNeeded()` als fire-and-forget. Skippt wenn `Date.now() - fetchedAt < 6h`. Sendet `If-None-Match: <etag>` → bei `304` nur `fetchedAt` aktualisieren.
- Manuell in Einstellungen: Sektion „Zutaten-Datenbank" → Button „Jetzt aktualisieren" → Alert mit Ergebnis.

**Konfiguration**: `BASELINE_GIST_URL` zeigt seit 1.4.0 auf einen öffentlichen Gist (`gist.github.com/j-esser/1f71eb989c5e7d2c189cf6bdb8255583`, Datei `baseline.json`). Wenn der Sync-Mechanismus für ein anderes Repo wiederverwendet werden soll, hier die Raw-URL eintragen.

**Schutz vor Datenverlust**: Sync schreibt ausschließlich in den Remote-Cache (`kochwelt_baseline_remote` + `_meta`). Weder `kochwelt_user_ingredients` noch `kochwelt_recipes` werden angefasst.

### Scripts (`scripts/`)
- `auditBaselineIngredients.ts`: prüft Match-Quote der Baseline-Rezepte gegen Baseline-Zutaten, generiert Markdown-Report `scripts/baseline-audit.md`. Aktuell 100 % (438/438).
- `calcBaselineNutrition.ts`: berechnet Nährwerte für alle 40 Baseline-Rezepte aus den Zutaten (`parseIngredientText` + `calcNutritionFromMatches`) und schreibt sie direkt in `constants/baselineRecipes.ts` zurück. Beim Erhöhen von `INGREDIENTS_VERSION` migriert die App alle bestehenden User-Stände.
- `exportBaselineForGist.ts`: erzeugt `scripts/baseline-gist.json` aus `BASELINE_INGREDIENTS` für den Gist-Upload. Aufruf: `npx tsx scripts/exportBaselineForGist.ts <version>` — Version IMMER inkrementieren.
- `parserSmokeTest.ts`: ad-hoc-Tests für `parseIngredientText`/`findBaselineMatch`.

Ausführung: `npx tsx scripts/<name>.ts` (nicht `ts-node` — bricht an Expo's `moduleResolution: "bundler"`).

---

## Bekannte Einschränkungen

- Expo Go inkompatibel mit iOS 26+ → iOS Simulator (Xcode) nutzen
- Kein Cloud-Sync — alle Daten lokal in AsyncStorage
- iOS Share Extension (direkter Safari-Share-Sheet-Eintrag) noch nicht implementiert

---

## Roadmap

- ⏳ iOS Share Extension (nativer Share-Sheet-Eintrag in Safari)
- ⏳ Nährwert-Statistiken (Charts)
- ⏳ Push-Erinnerungen (Kochen-Erinnerung)
- ⏳ Cloud-Sync (Supabase)
- ✅ Phase 4 Ingredient-Baseline: Gist-Sync aktiv seit 1.4.0. Pflege-Workflow: `npx tsx scripts/exportBaselineForGist.ts <version>` → Inhalt in den Gist pasten → User bekommen es beim nächsten Cold-Start.

---

## Release-Workflow (TestFlight)

Bei jedem App-Release wird unter `docs/release-notes/` ein Tester-Dokument
in drei Formaten angelegt: `Kochwelt-v<version>.{html,docx,rtf}`. Vorlage
ist `Kochwelt-v1.1.0.html` — Struktur: Begrüßung → „Was ist neu" → „Funktions-
Übersicht" (Home / Rezepte / Planer / Shopping / Einstellungen) →
Test-Schwerpunkte → Feedback-Aufruf.

Konvertierung HTML → docx/rtf via `textutil` (macOS, kein Pandoc nötig):

```bash
cd docs/release-notes
textutil -convert docx -output Kochwelt-v<version>.docx Kochwelt-v<version>.html
textutil -convert rtf  -output Kochwelt-v<version>.rtf  Kochwelt-v<version>.html
```

Bei Versions-Bump in `app.json` (`expo.version`) immer mitpflegen.
