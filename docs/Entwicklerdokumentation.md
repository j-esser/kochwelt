# Kochwelt — Entwicklerdokumentation

**Version 1.2 · Stand Mai 2026**

---

## Inhaltsverzeichnis

1. [Tech-Stack & Abhängigkeiten](#1-tech-stack--abhängigkeiten)
2. [Projektstruktur](#2-projektstruktur)
3. [Lokale Entwicklung](#3-lokale-entwicklung)
4. [Architektur-Überblick](#4-architektur-überblick)
5. [Navigation (Expo Router)](#5-navigation-expo-router)
6. [Datenpersistenz & Datenmodell](#6-datenpersistenz--datenmodell)
7. [Services — API-Referenz](#7-services--api-referenz)
8. [Screen-Referenz](#8-screen-referenz)
9. [Komponenten](#9-komponenten)
10. [Basis-Rezepte & Migrations-System](#10-basis-rezepte--migrations-system)
11. [Rezept-Import: URL, Deep Link, Clipboard](#11-rezept-import-url-deep-link-clipboard)
12. [Einkaufsliste teilen (ICS / Text)](#12-einkaufsliste-teilen-ics--text)
13. [Foto-Layout in Listen-Cards](#13-foto-layout-in-listen-cards)
14. [Styling-Konventionen](#14-styling-konventionen)
15. [Bekannte Einschränkungen & Plattform-Unterschiede](#15-bekannte-einschränkungen--plattform-unterschiede)
16. [Roadmap & Erweiterungspunkte](#16-roadmap--erweiterungspunkte)

---

## 1. Tech-Stack & Abhängigkeiten

| Technologie | Version | Zweck |
|---|---|---|
| Expo SDK | 55 | React Native Framework |
| Expo Router | ~4.x | File-based Navigation |
| React Native | ^0.76 | UI-Primitives |
| TypeScript | ~5.x | Typsicherheit |
| NativeWind v4 | ^4.x | Tailwind-Klassen in RN (selten genutzt) |
| AsyncStorage | ^2.x | Lokale Datenpersistenz |
| expo-file-system | ^18.x | Lokale Fotospeicherung, ICS-Export |
| expo-image-picker | ^16.x | Kamera / Galerie |
| expo-image-manipulator | ^13.x | Foto-Komprimierung |
| expo-document-picker | ^13.x | Datei-Auswahl für Import |
| expo-sharing | ^12.x | System-Share-Sheet (ICS, JSON) |
| expo-clipboard | ^7.x | Clipboard-Erkennung für URL-Import |
| expo-notifications | ^0.29.x | Geplante Erinnerungen |
| @expo/vector-icons | ^14.x | Ionicons |

**Paketmanager:** npm · **Mindest-Node:** v18

---

## 2. Projektstruktur

```
kochwelt/
├── app/
│   ├── (tabs)/
│   │   ├── _layout.tsx           # Tab-Konfiguration
│   │   ├── index.tsx             # Home / Dashboard
│   │   ├── rezepte.tsx           # Rezeptliste
│   │   ├── planer.tsx            # Wochenplaner
│   │   ├── two.tsx               # Einkaufsliste
│   │   └── einstellungen.tsx     # Einstellungen
│   ├── recipe/
│   │   ├── [id].tsx              # Detailansicht
│   │   ├── new.tsx               # Neues Rezept (liest ?importUrl=)
│   │   ├── pick.tsx              # Rezept-Picker Modal
│   │   └── edit/[id].tsx         # Rezept bearbeiten
│   ├── tools.tsx                 # Export / Import
│   └── _layout.tsx               # Root-Layout, App-Start-Logik
│
├── services/
│   ├── recipeStore.ts            # Rezept-CRUD, Migrationen, Foto-Handling, Einzel-Export
│   ├── plannerStore.ts           # Wochenplan-Verwaltung
│   ├── shoppingList.ts           # Einkaufslisten-Generator + ICS-Export
│   ├── nutritionGoals.ts         # Nährwertziele
│   ├── settingsStore.ts          # App-Einstellungen, Benachrichtigungen, Planer-Default
│   ├── recipePicker.ts           # Callback-Brücke Planer ↔ Picker-Modal
│   └── tips.ts                   # Zentrale Tipp-Liste, plattform-Filter
│
├── components/
│   ├── RecipeForm.tsx             # Formular (Erstellen + Bearbeiten + Import)
│   ├── RecipeImage.tsx            # Bild-Komponente mit Fallback
│   ├── TipButton.tsx              # ?-Icon, öffnet TipModal für einen Kontext
│   └── TipModal.tsx               # Bottom-Sheet mit Tipp-Liste
│
├── constants/
│   └── baselineRecipes.ts        # 40 Basis-Rezepte + Foto-Map
│
├── assets/images/
│   └── food-fallback.jpg         # Platzhalterbild
│
├── docs/
│   ├── Benutzerdokumentation.md
│   └── Entwicklerdokumentation.md
├── CLAUDE.md                     # Architektur-Referenz für Claude Code
└── app.json                      # Expo-Konfiguration
```

---

## 3. Lokale Entwicklung

```bash
git clone git@github.com:j-esser/kochwelt.git
cd kochwelt
npm install
npx expo start --web     # Web-Vorschau (kein Xcode nötig)
npx expo start           # i = iOS Simulator, a = Android Emulator
npx tsc --noEmit         # TypeScript-Check
npm test                 # Jest Unit-Tests
```

> Expo Go inkompatibel mit iOS 18+. Für physische iPhones: Development Build via EAS.

---

## 4. Architektur-Überblick

```
┌──────────────────────────────┐
│     app/ (Expo Router)        │  Screens laden Daten via useFocusEffect
│     kein globaler State       │  jeder Screen ist eigenständig
└─────────────┬────────────────┘
              │
┌─────────────▼────────────────┐
│       services/               │  Reine Funktionen, zustandslos
│       Lesen/Schreiben         │  Ausnahme: recipePicker (In-Memory-Callback)
└─────────────┬────────────────┘
              │
┌─────────────▼────────────────┐
│  AsyncStorage (lokal, JSON)   │
└──────────────────────────────┘
```

**Prinzipien:**
- Kein Redux / Context / Zustand — jeder Screen lädt selbst via `useFocusEffect`
- Services sind zustandslose Funktionen über AsyncStorage
- Ausnahme: `recipePicker.ts` hält einen In-Memory-Callback

---

## 5. Navigation (Expo Router)

| Datei | Route | Typ |
|---|---|---|
| `app/(tabs)/index.tsx` | `/` | Tab |
| `app/(tabs)/rezepte.tsx` | `/rezepte` | Tab |
| `app/(tabs)/planer.tsx` | `/planer` | Tab |
| `app/(tabs)/two.tsx` | `/two` | Tab |
| `app/(tabs)/einstellungen.tsx` | `/einstellungen` | Tab |
| `app/recipe/[id].tsx` | `/recipe/<id>` | Stack |
| `app/recipe/new.tsx` | `/recipe/new` + `?importUrl=` | Stack |
| `app/recipe/edit/[id].tsx` | `/recipe/edit/<id>` | Stack |
| `app/recipe/pick.tsx` | `/recipe/pick` | Modal |
| `app/tools.tsx` | `/tools` | Stack |

### Root-Layout App-Start

```typescript
// app/_layout.tsx
await seedIfEmpty();               // Erststart: 40 Baseline-Rezepte
await patchBaselineIngredients();  // Zutaten-Migration (INGREDIENTS_VERSION)
await patchBaselinePhotos();       // Foto-Migration (PHOTO_VERSION)
SplashScreen.hideAsync();
```

---

## 6. Datenpersistenz & Datenmodell

### AsyncStorage-Schlüssel

| Schlüssel | Inhalt |
|---|---|
| `kochwelt_recipes` | `Recipe[]` |
| `kochwelt_weekplan` | `WeekPlan` |
| `kochwelt_nutrition_goals` | `NutritionGoals` |
| `kochwelt_settings` | `AppSettings` |
| `kochwelt_photo_version` | Migrations-String |
| `kochwelt_ingredients_version` | Migrations-String |
| `kochwelt_notification_id` | Expo Notification ID |
| `kochwelt_shopping_selection` | Ausgewählte Datumsstrings |
| `kochwelt_shopping_checked` | Abgehakte Artikel |
| `kochwelt_shopping_owned` | „Vorhanden"-Artikel |

### Vollständiges Datenmodell

```typescript
interface Recipe {
  id: string;           // "r_<timestamp>_<random>" | Baseline-ID (stabil!)
  title: string;
  categories: string[];
  description: string;
  cookTime: number;     // Minuten
  portions: number;
  reference: string;    // URL oder Buchtext
  ingredients: Ingredient[];
  nutrition: Nutrition; // Gesamtwerte für alle Portionen
  photo?: string;       // file://-Pfad oder https-URL
  rating?: number;      // 1–5, undefined = nicht bewertet
}

interface Ingredient {
  name: string;
  amount: string;       // "200 g" | "2 EL" | "½ TL" | "" (ohne Menge)
  shopCategory: string;
}

interface Nutrition {
  kcal: number | null;
  protein: number | null;
  fat: number | null;
  carbs: number | null;
}
```

> **Wichtig:** `nutrition`-Werte sind **Gesamtwerte** (alle Portionen). Für Pro-Portion-Anzeige immer durch `recipe.portions` teilen.

```typescript
// WeekPlan
type MealSlot = 'mittag' | 'abend';

interface PlannedMeal {
  recipeId?: string;       // undefined = Kalte Küche / manueller Eintrag
  portions: number;
  manualTitle?: string;
  manualNutrition?: { kcal: number; protein: number; fat: number; carbs: number };
}

type WeekPlan = Record<string, Partial<Record<MealSlot, PlannedMeal>>>;
// Key: "YYYY-MM-DD"
```

> **Wichtig:** `meal.recipeId` kann `undefined` sein — vor jedem Zugriff auf `recipeMap[meal.recipeId]` prüfen.

---

## 7. Services — API-Referenz

### `recipeStore.ts`

```typescript
// Migrations-Konstanten — erhöhen löst Migration bei allen Nutzern aus
const INGREDIENTS_VERSION = '2';
const PHOTO_VERSION = '4';

// Startup
seedIfEmpty(): Promise<void>
patchBaselineIngredients(): Promise<void>
patchBaselinePhotos(): Promise<void>

// CRUD
getAllRecipes(): Promise<Recipe[]>            // A–Z sortiert (de)
getRecipeById(id: string): Promise<Recipe | null>
saveRecipe(recipe: Recipe): Promise<void>    // upsert nach ID
deleteRecipe(id: string): Promise<void>      // + Foto löschen
setRecipeRating(id: string, rating: number | undefined): Promise<void>
createId(): string                           // "r_<timestamp>_<random>"

// Foto
saveRecipePhoto(recipeId: string, uri: string): Promise<string>
deleteRecipePhoto(recipeId: string): Promise<void>

// Hilfsfunktionen
buildTeaser(recipe: Recipe): RecipeTeaser    // { attrs, ingredients }
exportRecipesJSON(): Promise<string>          // Alle Rezepte (ohne Fotos)
exportSingleRecipeJSON(recipe: Recipe): string // Einzel-Rezept als 1-elementiges Array (ohne Foto)
importRecipesJSON(json: string): Promise<ImportResult>

RECIPE_TABS: string[]
```

**`exportSingleRecipeJSON`:** Synchroner Helper für die Einzel-Rezept-Teilen-Funktion in der Detailansicht. Gibt `[recipe]` als JSON zurück, damit der bestehende `importRecipesJSON()`-Pfad das Format ohne Sonderbehandlung lesen kann.

### `plannerStore.ts`

```typescript
getWeekPlan(): Promise<WeekPlan>
setMeal(date: string, slot: MealSlot, meal: PlannedMeal | null): Promise<void>
addSnack(date: string, snack: PlannedMeal): Promise<void>
removeSnack(date: string, index: number): Promise<void>
weekStart(date: Date): Date
toDateKey(date: Date): string               // → "YYYY-MM-DD"
addDays(date: Date, n: number): Date
getCookDatesForRecipe(recipeId: string, days: number): Promise<string[]>
getCookCountsLastNDays(days: number): Promise<Record<string, number>>
getWeekStats(): Promise<{ days: number; meals: number }>

WEEKDAYS: string[]        // ['Mo','Di','Mi','Do','Fr','Sa','So']
WEEKDAYS_LONG: string[]
```

### `shoppingList.ts`

```typescript
buildShoppingList(weekPlan: WeekPlan, recipeMap: Record<string, Recipe>): ShoppingList
scaleAmount(amount: string, factor: number): string
shoppingListToText(list: ShoppingList): string
shoppingListToICS(list: ShoppingList): string   // iCalendar VTODO-Format
CATEGORY_ORDER: string[]
```

**`scaleAmount`:** Parst unicode-Brüche (½ ¼ ¾ ⅓ ⅔), extrahiert Zahl + Einheit, skaliert, rundet auf 1 Dezimalstelle. Bei nicht-parsbarem Input → Original zurückgeben.

**`shoppingListToICS`:** Generiert RFC 5545 iCalendar mit `VTODO`-Einträgen (ein Artikel = ein TODO). Kann per `Sharing.shareAsync()` direkt an iOS Reminders weitergegeben werden.

### `nutritionGoals.ts`

```typescript
getNutritionGoals(): Promise<NutritionGoals>   // fehlende Felder mit Defaults
saveNutritionGoals(goals: NutritionGoals): Promise<void>
getMealDefaults(goals: NutritionGoals, type: MealType): { kcal, protein, carbs, fat }
DEFAULT_GOALS: NutritionGoals          // kcal: 2000, protein: 75, carbs: 250, fat: 70
MEAL_TYPE_LABELS: Record<MealType, string>  // 'frueh'→'Frühstück' etc.

type MealType = 'frueh' | 'mittag' | 'abend' | 'sonst'
```

**`getMealDefaults`:** Berechnet Default-Nährwerte für einen Mahlzeit-Typ als `Tagesziel × splits[type] / 100`. Wird im Snack-/Kalte-Küche-Modal in `planer.tsx` für die Vorbelegung verwendet (Frühstück 25 % von 2000 kcal = 500 kcal).

### `settingsStore.ts`

```typescript
interface AppSettings {
  reminderFrequency: 'never' | 'daily' | 'weekly';
  reminderWeekday: number;        // 0=So … 6=Sa (JS-Standard)
  reminderHour: number;
  reminderMinute: number;
  defaultPlannerPortions: number; // Default-Portionen beim Hinzufügen einer Mahlzeit zum Planer
}

DEFAULT_SETTINGS: AppSettings  // reminderFrequency: 'weekly', defaultPlannerPortions: 2

getSettings(): Promise<AppSettings>          // Merge aus DEFAULT_SETTINGS + Stored
saveSettings(settings: AppSettings): Promise<void>
requestNotificationPermission(): Promise<boolean>
scheduleReminder(settings: AppSettings): Promise<void>
cancelReminder(): Promise<void>
WEEKDAY_LABELS: string[]
```

> **Defaults bei Bestandsdaten:** `getSettings()` mergt mit `DEFAULT_SETTINGS`, also bekommen ältere Installationen automatisch `defaultPlannerPortions: 2`. Der neue `'weekly'`-Default greift nur, wenn die Settings noch nie gespeichert wurden.

> **Wochentag-Offset:** JS nutzt 0=Sonntag, expo-notifications nutzt 1=Sonntag → intern +1 beim Scheduling.

> **`defaultPlannerPortions` wird ausgelesen in:** `app/recipe/pick.tsx` (Picker-Karten), `app/recipe/[id].tsx` (Zum-Planer-Modal), `app/(tabs)/planer.tsx` (Snack/Kalte-Küche-Modal).

### `tips.ts`

```typescript
type TipPlatform = 'all' | 'ios' | 'android';

interface Tip {
  id: string;
  context: string;        // 'recipe-form-text' | 'recipe-form-import' | 'recipes' |
                          // 'recipe-detail' | 'planner' | 'shopping'
  icon: string;           // Ionicons-Name
  title: string;
  body: string;
  platform?: TipPlatform; // default 'all'
}

TIPS: Tip[]                              // Zentrale Tipp-Liste — neue Tipps hier ergänzen
tipsFor(context: string): Tip[]          // Plattform-gefiltert
allVisibleTips(): Tip[]                  // Alle für aktuelle Plattform sichtbaren
CONTEXT_LABELS: Record<string, string>   // 'recipe-form-text' → 'Rezept eingeben' usw.
```

Plattform-Filter: `Platform.OS === 'ios' ? 'ios' : 'android'`. Web verhält sich wie Android (alle nicht-iOS-Tipps werden gezeigt; iOS-only-Tipps fallen weg).

### `recipePicker.ts`

```typescript
// In-Memory-Callback-Brücke zwischen Planer und Picker-Modal
registerPickCallback(cb: (recipeId: string, portions: number) => Promise<void>): void
completePick(recipeId: string, portions: number): void
cancelPick(): void
```

---

## 8. Screen-Referenz

### `app/recipe/new.tsx`

```typescript
const { importUrl } = useLocalSearchParams<{ importUrl?: string }>();
return <RecipeForm title="Neues Rezept" importUrl={importUrl} />;
```

Liest `importUrl` aus dem Query-Param und gibt ihn an `RecipeForm` weiter. Expo Router liefert diesen automatisch wenn der Deep Link `kochwelt://recipe/new?importUrl=...` aufgerufen wird.

### `app/recipe/[id].tsx` — Detailansicht

**Portions-Skalierung:**
```typescript
const factor = scaledPortions / (recipe.portions || 1);
// factor === 1 → Original anzeigen (kein Rounding-Artefakt)
const display = factor === 1 ? ing.amount : scaleAmount(ing.amount, factor);
```

**Planer-Integration:** FAB „Zum Planer" öffnet Modal → `setMeal(dateKey, slot, {recipeId, portions})`. Initial-Portions kommen aus `getSettings().defaultPlannerPortions`.

**Einzel-Rezept-Teilen:** Header-Icon `share-outline` → `handleShareRecipe()`:

```typescript
const json = exportSingleRecipeJSON(recipe);            // Array-Wrapper, ohne photo
const filename = `Kochwelt-${slug(recipe.title)}.json`;  // ä→ae, Sonderzeichen zu '-'
// Native: cache-Datei schreiben + Sharing.shareAsync (mimeType 'application/json', UTI 'public.json')
// Web: Blob-URL + automatischer <a download>-Click
// Fallback (Sharing nicht verfügbar): Share.share({ message: json })
```

Slug-Funktion ist lokal in der Datei, bewusst klein gehalten (60 Zeichen Cap, fallback `'rezept'`).

### `app/(tabs)/two.tsx` — Einkaufsliste

**Share-Button** öffnet Action Sheet (iOS) / Alert (Android):
```typescript
// Option 1: Text
Share.share({ message: shoppingListToText(list) });

// Option 2: ICS-Datei
const ics = shoppingListToICS(list);
await FileSystem.writeAsStringAsync(path, ics);
await Sharing.shareAsync(path, { mimeType: 'text/calendar', UTI: 'public.calendar' });
```

### `app/(tabs)/einstellungen.tsx`

Sektionen (von oben nach unten):

1. **Tipps & Tricks** — gruppiert via `CONTEXT_LABELS`, nutzt `allVisibleTips()`. State `expandedTip: string | null` steuert das Aufklappen einzelner Zeilen.
2. **Rezept aus Browser importieren** — platform-spezifische Hinweise (iOS Clipboard-Flow / Android Share Sheet).
3. **Erinnerungen** — Häufigkeit (Nie / Wöchentlich / Täglich), Wochentag, Uhrzeit. Default `weekly`.
4. **Wochenplaner** — `defaultPlannerPortions` (1–20).
5. **Ernährungs- & Kalorienziele** — kcal/Protein/Kohlenhydrate/Fett.
6. **Mahlzeit-Verteilung** — Splits (frueh/mittag/abend/sonst), Summe muss 100 % ergeben.

---

## 9. Komponenten

### `RecipeForm.tsx`

**Props:**
```typescript
interface Props {
  initial?: Recipe;    // Edit-Modus wenn vorhanden
  title: string;
  importUrl?: string;  // Deep-Link-URL → Auto-Import beim Öffnen
}
```

**Import-Reihenfolge beim Öffnen:**
1. `importUrl` prop gesetzt → `handleUrlImport(importUrl)` sofort (mit Lade-Overlay)
2. Kein `importUrl` → Clipboard prüfen via `expo-clipboard`
   - Gültige HTTP/HTTPS-URL erkannt → Alert: „Importieren?"
   - Kein URL → normales leeres Formular

**`handleUrlImport(urlOverride?)`:**
```typescript
// Akzeptiert optionale URL (für Clipboard/Deep-Link), sonst urlInput-State
const url = urlOverride ?? urlInput.trim();
// Fetch → HTML → Regex für JSON-LD → extractFromJsonLd() → applyImport()
```

**Zutaten-Parser:**
```typescript
// Erkennt: "200 g Mehl", "2 EL Olivenöl", "½ TL Salz"
// Unterstützt: ½ ¼ ¾ ⅓ ⅔
// Einheiten: g, kg, ml, l, EL, TL, Stk., Prise, Bund, ...
// Fallback: Zeile = Name ohne Menge
```

**Vorlage-/Import-Modal** (Button „JSON / Vorlage"):
- State: `showTemplateModal`, `templateMode: 'choose'|'pickRecipe'`
- Drei Optionen im Choose-Modus:
  - `handleApplyBlankTemplate()` → `applyImport(RECIPE_TEMPLATE)` (Konstante mit Beispieldaten)
  - „Aus vorhandenem Rezept" → wechselt zu `pickRecipe`, lädt `getAllRecipes()`, zeigt durchsuchbare Liste
  - `handleApplyFromRecipe(recipe)` → kopiert alle Felder (Titel + „(Kopie)"-Suffix), ohne `id`/`photo`/`rating`
  - `handleJsonImport()` → bestehender DocumentPicker-Flow
- `applyImport()` setzt Title, Description, CookTime, Portions, Ingredients, Reference, kcal/Protein/Fett/KH, Categories.

**Tastatur-Behandlung** (Lib `react-native-keyboard-aware-scroll-view`):
- `KeyboardAwareScrollView` statt `ScrollView`
- Auf Multiline-Inputs (Zutaten, Zubereitung): Refs + `onContentSizeChange` + `onFocus` rufen `scrollToFocusedInput(node, 120, 0)` — KAS scrollt sonst nicht beim Wachsen des Cursors

### `TipButton.tsx` + `TipModal.tsx`

```typescript
// TipButton
interface Props {
  context: string;
  size?: number;       // default 20
  color?: string;      // default '#a8a29e'
  style?: StyleProp<ViewStyle>;
  title?: string;      // override für Modal-Titel; default CONTEXT_LABELS[context]
}
```

`<TipButton context="recipe-form-text" />` lädt `tipsFor(context)`. Sind keine Tipps vorhanden (Kontext leer oder alle plattform-fremd), rendert die Komponente `null` — kein Layout-Aufwand bei den Aufrufstellen.

`TipModal` ist ein Bottom-Sheet im Stil des bestehenden Vorlage-Modals (weißer Hintergrund, abgerundete obere Ecken, Backdrop `rgba(0,0,0,0.35)`, max. 85 % Höhe). Tipp-Karten verwenden den Cream-Orange-Stil (`#fff7ed`/`#fed7aa`) wie der Browser-Import-Hinweis in Einstellungen.

**Aufrufstellen:**

| Stelle | Context |
|---|---|
| `RecipeForm.tsx` neben Label „Zutaten" | `recipe-form-text` |
| `RecipeForm.tsx` neben Label „Zubereitung" | `recipe-form-text` |
| `RecipeForm.tsx` in Header der „Rezept importieren"-Box | `recipe-form-import` |
| `app/recipe/[id].tsx` Header (zwischen Bearbeiten und Teilen) | `recipe-detail` |
| `app/(tabs)/rezepte.tsx` Header (`navActions`) | `recipes` |
| `app/(tabs)/planer.tsx` Header | `planner` |
| `app/(tabs)/two.tsx` Header (beide Varianten: empty + with-content) | `shopping` |

Zentrale Übersicht in `einstellungen.tsx`: nutzt `allVisibleTips()` und gruppiert via `CONTEXT_LABELS`. Aufklapp-Pattern (kein Modal) durch State `expandedTip: string | null`.

### `app/(tabs)/planer.tsx` — Tagesziel-Berechnung

```typescript
// calcDayNutrition: pro Mahlzeit immer 1 Portion
const factor = 1 / (r.portions || 1);
kcal += r.nutrition.kcal * factor;
// meal.portions ist NUR für die Einkaufsliste relevant
```

**Snack-/Kalte-Küche-Modal:** Mahlzeit-Typ-Chips (Frühstück/Mittag/Abend/Snack) → `getMealDefaults(goals, type)` füllt kcal/Protein/Fett/KH vor. Default-Auswahl je nach Einstiegspunkt (Mittag-Slot → 'mittag', Abend-Slot → 'abend', „Snack hinzufügen" → 'sonst'). Werte zählen direkt als 1 Portion zum Tagesziel.

---

## 10. Basis-Rezepte & Migrations-System

### Struktur

```typescript
// Stabile IDs — nie ändern
const BASELINE_PHOTO_MAP: Record<string, string> = { ... };
export const BASELINE_RECIPES: Recipe[] = [ ... ]; // 40 Rezepte
```

### Migrationen auslösen

```typescript
// services/recipeStore.ts
const INGREDIENTS_VERSION = '2';  // erhöhen → Zutaten/Portionen aller Baseline-Rezepte
const PHOTO_VERSION = '4';        // erhöhen → Foto-URLs aller Baseline-Rezepte
```

**Was migriert wird / nicht wird:**
- Baseline-Rezepte (stabile IDs): `ingredients`, `portions`, `photo` werden überschrieben
- Nutzer-eigene Rezepte (`r_<timestamp>_<random>`): werden nie angefasst

### Bulk-Update-Skript

Für manuelle Zutaten-Korrekturen an allen 40 Basis-Rezepten: `/tmp/update_baseline_ingredients.js`. Ablauf: TS-Datei einlesen → JSON-Array extrahieren → modifizieren → zurückschreiben → `INGREDIENTS_VERSION` erhöhen.

---

## 11. Rezept-Import: URL, Deep Link, Clipboard

### Drei Eingabewege

| Weg | Plattform | Setup | Auslöser |
|---|---|---|---|
| Manuell „Von URL" | alle | keiner | Button im Formular |
| Clipboard-Erkennung | iOS + Android | keiner | Öffnen von „Neues Rezept" |
| Deep Link | alle | keiner (Android nativ) | `kochwelt://recipe/new?importUrl=...` |

### Deep-Link-Format

```
kochwelt://recipe/new?importUrl=https%3A%2F%2Fwww.chefkoch.de%2Frezepte%2F...
```

Expo Router mappt diesen Link automatisch auf `app/recipe/new.tsx` mit `importUrl` als `useLocalSearchParams`-Wert. Kein Code in `_layout.tsx` nötig.

### Android Intent Filter (`app.json`)

```json
"intentFilters": [
  {
    "action": "SEND",
    "data": [{ "mimeType": "text/plain" }],
    "category": ["DEFAULT"]
  }
]
```

Macht Kochwelt im Android Share Sheet sichtbar. Geteilter Text (URL) kommt über den Intent an.

### iOS: Kein nativer Share-Sheet-Eintrag

iOS erfordert eine **Share Extension** (separates Xcode-Target). In Expo managed workflow nicht ohne Config Plugin umsetzbar. **Aktueller Workaround:** Clipboard-Flow. **Geplant:** Share Extension in einer späteren Version.

### JSON-LD-Extraktion

```typescript
// Sucht alle <script type="application/ld+json"> Blöcke
// Prüft auf @type === "Recipe" oder @type includes "Recipe"
// Unterstützt @graph-Strukturen
// Extrahiert: name, recipeIngredient, recipeInstructions,
//             cookTime (ISO 8601), recipeYield, nutrition.calories
```

---

## 12. Einkaufsliste teilen (ICS / Text)

### Action Sheet (iOS) / Alert (Android)

`two.tsx` zeigt bei Tap auf „Teilen" ein Auswahlmenü:

**Option 1 — Als Text:**
```typescript
Share.share({ message: shoppingListToText(list), title: 'Einkaufsliste' });
// → iOS/Android Share Sheet mit formatiertem Text
```

**Option 2 — Als Erinnerung (.ics):**
```typescript
const ics = shoppingListToICS(list);
await FileSystem.writeAsStringAsync(
  FileSystem.documentDirectory + 'einkaufsliste.ics', ics
);
await Sharing.shareAsync(path, { mimeType: 'text/calendar', UTI: 'public.calendar' });
// → iOS Reminders öffnet die Datei, jeder Artikel = abhakbarer VTODO
```

### ICS-Format

```
BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Kochwelt//DE
BEGIN:VTODO
UID:kochwelt-<timestamp>-<idx>@kochwelt
DTSTAMP:<ISO-timestamp>
SUMMARY:600 g Tomaten
CATEGORIES:Gemüse & Obst
STATUS:NEEDS-ACTION
END:VTODO
...
END:VCALENDAR
```

---

## 13. Foto-Layout in Listen-Cards

Die Listen-Cards in `app/(tabs)/rezepte.tsx` und `app/recipe/pick.tsx` verwenden **fixe Pixel-Höhe** für `cardThumb`, **nicht** `aspectRatio`:

```typescript
// rezepte.tsx
cardThumb: { width: '100%', height: 180 },
// pick.tsx
cardThumb: { width: '100%', height: 160 },
```

Hintergrund: `aspectRatio` mit `width: '100%'` greift bei Image-Komponenten in React Native nicht zuverlässig — bei Hochkant-Fotos (typisch von der Handy-Kamera) kann das Bild seine natürliche Höhe behalten und das Card-Layout sprengen. Eine fixe Höhe ist deterministisch: `RecipeImage` nutzt `resizeMode='cover'`, dadurch füllt das Bild den Rahmen ohne Verzerrung — der Bildausschnitt wird beschnitten, das Format bleibt stabil.

Detailansicht (`heroImage`) und Home-Featured-Card folgen demselben Prinzip (fixe Höhe bzw. `absoluteFill` in einem Container mit fixer Höhe).

---

## 14. Styling-Konventionen

### Farbpalette

```typescript
'#f97316'  // Orange — Primary, CTAs
'#fff7ed'  // Orange-50 — Chip-Hintergrund
'#f5f5f4'  // Stone-50 — App-Hintergrund
'#1c1917'  // Stone-900 — Haupttext
'#57534e'  // Stone-600 — Sekundärtext
'#a8a29e'  // Stone-400 — Platzhalter
'#e7e5e4'  // Stone-200 — Trennlinien
'#22c55e'  // Grün — Erfolg
'#ef4444'  // Rot — Fehler/Löschen
'#3b82f6'  // Blau — Kalte Küche
```

Überwiegend `React Native StyleSheet` (inline, screen-spezifisch). NativeWind v4 selten für Utility-Klassen. Portrait-only, keine Responsive-Breakpoints.

---

## 15. Bekannte Einschränkungen & Plattform-Unterschiede

| Feature | iOS | Android | Web |
|---|---|---|---|
| Foto aufnehmen | ✅ | ✅ | ❌ |
| Share Sheet | ✅ | ✅ | ❌ |
| ICS-Export | ✅ | ✅ | ✅ (Blob) |
| Benachrichtigungen | ✅ | ✅ | ❌ |
| Nativ im Browser-Share-Sheet | ❌ (Share Extension nötig) | ✅ (Intent Filter) | — |
| Clipboard-Erkennung | ✅ | ✅ | ❌ |
| Deep Link | ✅ | ✅ | ❌ |

---

## 16. Roadmap & Erweiterungspunkte

### iOS Share Extension (Priorität: hoch)

Macht Kochwelt nativ im Safari-Share-Sheet sichtbar. Erfordert:
- Config Plugin oder Bare Workflow
- Separates Xcode-Target (`ShareExtension`)
- Kommunikation mit Haupt-App via App Groups / Shared Container

Community-Paket als Ausgangspunkt: `expo-share-extension`

### Nährwert-Charts

```typescript
// Datenquelle: getWeekPlan() über mehrere Wochen
// Empfehlung: victory-native oder react-native-chart-kit
// Views: Wochendurchschnitt, Tagesverteilung, Makro-Trend
```

### Cloud-Sync (Supabase)

- Supabase Auth + PostgreSQL (`recipes`, `week_plans`)
- Row-Level Security pro Nutzer
- Sync-Strategie: lokale Änderungen mit Timestamp → Last-Write-Wins oder Conflict-UI

### Tests erweitern

Aktuell: Unit-Tests für `shoppingList.ts` und `plannerStore.ts`. Ausbau:
- `@testing-library/react-native` für Komponenten
- E2E mit Maestro oder Detox
