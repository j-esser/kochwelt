# Kochwelt — Entwicklerdokumentation

**Version 1.0 · Stand April 2026**

---

## Inhaltsverzeichnis

1. [Tech-Stack & Abhängigkeiten](#1-tech-stack--abhängigkeiten)
2. [Projektstruktur](#2-projektstruktur)
3. [Lokale Entwicklung](#3-lokale-entwicklung)
4. [Architektur-Überblick](#4-architektur-überblick)
5. [Navigation (Expo Router)](#5-navigation-expo-router)
6. [Datenpersistenz & Datenmodell](#6-datenpersistenz--datenmodell)
7. [Services — API-Referenz](#7-services--api-referenz)
   - 7.1 [recipeStore.ts](#71-recipestorets)
   - 7.2 [plannerStore.ts](#72-plannerstorets)
   - 7.3 [shoppingList.ts](#73-shoppinglistts)
   - 7.4 [nutritionGoals.ts](#74-nutritiongoalsts)
   - 7.5 [settingsStore.ts](#75-settingsstorets)
   - 7.6 [recipePicker.ts](#76-recipepickerts)
8. [Screen-Referenz](#8-screen-referenz)
9. [Komponenten](#9-komponenten)
10. [Basis-Rezepte & Migrations-System](#10-basis-rezepte--migrations-system)
11. [Styling-Konventionen](#11-styling-konventionen)
12. [Bekannte Einschränkungen & Plattform-Unterschiede](#12-bekannte-einschränkungen--plattform-unterschiede)
13. [Roadmap & Erweiterungspunkte](#13-roadmap--erweiterungspunkte)

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
| expo-file-system | ^18.x | Lokale Fotospeicherung |
| expo-image-picker | ^16.x | Kamera / Galerie |
| expo-image-manipulator | ^13.x | Foto-Komprimierung |
| expo-document-picker | ^13.x | Datei-Auswahl für Import |
| expo-sharing | ^12.x | System-Share-Sheet |
| expo-notifications | ^0.29.x | Geplante Erinnerungen |
| @expo/vector-icons | ^14.x | Ionicons |

**Paketmanager:** npm  
**Mindest-Node:** v18

---

## 2. Projektstruktur

```
kochwelt/
├── app/                          # Expo Router — jede Datei = Route
│   ├── (tabs)/                   # Tab-Gruppe (gemeinsame Tab-Bar)
│   │   ├── _layout.tsx           # Tab-Konfiguration
│   │   ├── index.tsx             # Home / Dashboard
│   │   ├── rezepte.tsx           # Rezeptliste
│   │   ├── planer.tsx            # Wochenplaner
│   │   ├── two.tsx               # Einkaufsliste
│   │   └── einstellungen.tsx     # Einstellungen
│   ├── recipe/
│   │   ├── [id].tsx              # Rezept-Detailansicht
│   │   ├── new.tsx               # Neues Rezept (Wrapper)
│   │   ├── pick.tsx              # Rezept-Picker Modal
│   │   └── edit/
│   │       └── [id].tsx          # Rezept bearbeiten (Wrapper)
│   ├── tools.tsx                 # Export / Import
│   ├── modal.tsx                 # Generisches Modal (Expo-Template)
│   ├── _layout.tsx               # Root-Layout, App-Start-Logik
│   └── +not-found.tsx            # 404-Fallback
│
├── services/                     # Geschäftslogik & Datenzugriff
│   ├── recipeStore.ts            # Rezept-CRUD, Migrationen, Foto-Handling
│   ├── plannerStore.ts           # Wochenplan-Verwaltung
│   ├── shoppingList.ts           # Einkaufslisten-Generator
│   ├── nutritionGoals.ts         # Nährwertziele
│   ├── settingsStore.ts          # App-Einstellungen, Benachrichtigungen
│   └── recipePicker.ts           # Callback-Brücke Planer ↔ Picker-Modal
│
├── components/
│   ├── RecipeForm.tsx             # Formular (Erstellen + Bearbeiten)
│   └── RecipeImage.tsx            # Bild-Komponente mit Fallback
│
├── constants/
│   └── baselineRecipes.ts        # 40 Basis-Rezepte + Foto-Map
│
├── assets/
│   └── images/
│       └── food-fallback.jpg     # Platzhalterbild für Rezepte ohne Foto
│
├── CLAUDE.md                     # Architektur-Referenz für Claude Code
├── README.md                     # Projekt-Übersicht
├── docs/
│   ├── Benutzerdokumentation.md  # Diese Datei
│   └── Entwicklerdokumentation.md
├── app.json                      # Expo-Konfiguration
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

---

## 3. Lokale Entwicklung

### Setup

```bash
git clone git@github.com:j-esser/kochwelt.git
cd kochwelt
npm install
```

### Entwicklungsserver starten

```bash
npx expo start           # Metro Bundler starten
npx expo start --web     # Nur Web-Vorschau (kein Xcode nötig)
```

Im Terminal:
- `i` → iOS Simulator (benötigt Xcode + macOS)
- `a` → Android Emulator (benötigt Android Studio)
- `w` → Webbrowser

> **Hinweis:** Expo Go ist ab iOS 18+ nicht mehr kompatibel. Für physische iPhones wird ein Development Build über EAS benötigt.

### TypeScript-Typen prüfen

```bash
npx tsc --noEmit
```

### Tests ausführen

```bash
npm test                 # Jest
npm test -- --watch      # Watch-Modus
```

Tests liegen in `__tests__/`. Vorhanden: Unit-Tests für `shoppingList.ts` und `plannerStore.ts`.

---

## 4. Architektur-Überblick

```
┌─────────────────────────────────────────┐
│              app/ (Expo Router)          │
│   Screens lesen/schreiben Services       │
└──────────────┬──────────────────────────┘
               │ importieren
┌──────────────▼──────────────────────────┐
│           services/                      │
│   Reine Funktionen, kein UI-State        │
│   Lesen/Schreiben → AsyncStorage         │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│        AsyncStorage (lokal)              │
│   JSON-serialisiert, kein Schema         │
└─────────────────────────────────────────┘
```

**Prinzipien:**
- **Kein globaler State** (kein Redux, kein Zustand, kein Context) — jeder Screen lädt seine Daten selbst beim Fokus via `useFocusEffect`.
- **Services sind zustandslos** — reine Funktionen über AsyncStorage.
- **Ausnahme: recipePicker.ts** — hält einen In-Memory-Callback für die Picker-Brücke.

---

## 5. Navigation (Expo Router)

Expo Router verwendet das Dateisystem als Navigationsstruktur. Jede Datei in `app/` entspricht einer Route.

### Routen-Übersicht

| Datei | Route | Typ |
|---|---|---|
| `app/(tabs)/index.tsx` | `/` | Tab-Screen |
| `app/(tabs)/rezepte.tsx` | `/rezepte` | Tab-Screen |
| `app/(tabs)/planer.tsx` | `/planer` | Tab-Screen |
| `app/(tabs)/two.tsx` | `/two` | Tab-Screen |
| `app/(tabs)/einstellungen.tsx` | `/einstellungen` | Tab-Screen |
| `app/recipe/[id].tsx` | `/recipe/<id>` | Stack-Screen |
| `app/recipe/new.tsx` | `/recipe/new` | Stack-Screen |
| `app/recipe/edit/[id].tsx` | `/recipe/edit/<id>` | Stack-Screen |
| `app/recipe/pick.tsx` | `/recipe/pick` | Modal |
| `app/tools.tsx` | `/tools` | Stack-Screen |

### Navigation in Code

```typescript
import { router, useLocalSearchParams } from 'expo-router';

// Navigieren
router.push('/recipe/new');
router.push(`/recipe/${id}`);
router.replace('/rezepte');
router.back();

// Parameter lesen (in [id].tsx)
const { id } = useLocalSearchParams<{ id: string }>();
```

### Root-Layout (`app/_layout.tsx`)

Führt beim App-Start sequenziell drei asynchrone Operationen aus, bevor der Splash-Screen versteckt wird:

```typescript
await seedIfEmpty();               // Erststart: 40 Basis-Rezepte laden
await patchBaselineIngredients();  // Zutaten-Migration (versioniert)
await patchBaselinePhotos();       // Foto-Migration (versioniert)
SplashScreen.hideAsync();
```

---

## 6. Datenpersistenz & Datenmodell

Alle Daten werden in **AsyncStorage** gespeichert (schlüssel-wert, JSON-serialisiert). Kein Schema-Enforcement — Typen nur zur Compile-Zeit.

### AsyncStorage-Schlüssel

| Schlüssel | Inhalt | Service |
|---|---|---|
| `kochwelt_recipes` | `Recipe[]` | recipeStore |
| `kochwelt_weekplan` | `WeekPlan` | plannerStore |
| `kochwelt_nutrition_goals` | `NutritionGoals` | nutritionGoals |
| `kochwelt_settings` | `AppSettings` | settingsStore |
| `kochwelt_photo_version` | `string` | recipeStore (Migration) |
| `kochwelt_ingredients_version` | `string` | recipeStore (Migration) |
| `kochwelt_notification_id` | `string` | settingsStore |
| `kochwelt_shopping_selection` | `string[]` | two.tsx (Datumsauswahl) |
| `kochwelt_shopping_checked` | JSON-Map | two.tsx (Checkmarks) |
| `kochwelt_shopping_owned` | JSON-Map | two.tsx (Vorhanden-Status) |

### Vollständiges Datenmodell

#### Recipe

```typescript
interface Recipe {
  id: string;           // Format: "r_<timestamp>_<random>" | Baseline-ID
  title: string;
  categories: string[]; // Aus RECIPE_TABS
  description: string;  // Zubereitungstext (Freitext)
  cookTime: number;     // Minuten
  portions: number;     // Standardportionszahl
  reference: string;    // URL oder Buchquelle
  ingredients: Ingredient[];
  nutrition: Nutrition; // Gesamtwerte (alle Portionen zusammen)
  photo?: string;       // Lokaler file://-Pfad oder https-URL
  rating?: number;      // Persönliche Bewertung 1–5
}
```

#### Ingredient

```typescript
interface Ingredient {
  name: string;         // z.B. "Zwiebel", "Parmesan"
  amount: string;       // z.B. "200 g", "2 EL", "½ TL", "" (für unklar)
  shopCategory: string; // Einkaufskategorie (s. CATEGORY_ORDER)
}
```

#### Nutrition

```typescript
interface Nutrition {
  kcal: number | null;
  protein: number | null;  // Gramm
  fat: number | null;      // Gramm
  carbs: number | null;    // Gramm
}
```

> **Wichtig:** Nährwerte im `Recipe`-Objekt sind **Gesamtwerte** (für alle Portionen zusammen). Alle Anzeigen rechnen mit `value / portions` für die Pro-Portion-Anzeige.

#### WeekPlan

```typescript
type MealSlot = 'mittag' | 'abend';

interface PlannedMeal {
  recipeId?: string;              // undefined = manuelle Mahlzeit (Kalte Küche)
  portions: number;
  manualTitle?: string;           // nur bei manuellem Eintrag
  manualNutrition?: {             // nur bei manuellem Eintrag
    kcal: number;
    protein: number;
    fat: number;
    carbs: number;
  };
}

type DayPlan = Partial<Record<MealSlot, PlannedMeal>>;
type WeekPlan = Record<string, DayPlan>;  // Key: "YYYY-MM-DD" (Datum des Tages)
```

> **Wichtig:** `recipeId` kann `undefined` sein. Immer prüfen vor dem Zugriff auf `recipeMap[meal.recipeId]`.

#### NutritionGoals

```typescript
interface NutritionGoals {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  splits: {
    frueh: number;    // % Frühstück
    mittag: number;   // % Mittag
    abend: number;    // % Abend
    sonst: number;    // % Sonstiges
  };
}
```

#### AppSettings

```typescript
type ReminderFrequency = 'never' | 'daily' | 'weekly';

interface AppSettings {
  reminderFrequency: ReminderFrequency;
  reminderWeekday: number;  // 0–6, JS-Standard (0 = Sonntag)
  reminderHour: number;     // 0–23
  reminderMinute: number;   // 0–59
}
```

### Lokale Foto-Speicherung

```
FileSystem.documentDirectory
  └── recipe_photos/
        ├── r_1234567890_abc12.jpg
        └── bolognese.jpg
```

- Fotos werden als JPEG (70 % Qualität, max. 800 px Breite) gespeichert.
- Dateiname = `<recipeId>.jpg`
- Beim Löschen eines Rezepts wird das Foto automatisch mit gelöscht.
- Auf Web: FileSystem nicht verfügbar — Fotos werden als https-URLs gespeichert (oder nicht verwendet).

---

## 7. Services — API-Referenz

### 7.1 `recipeStore.ts`

**Migrations-Konstanten** (Erhöhen erzwingt Migration beim nächsten App-Start):

```typescript
const INGREDIENTS_VERSION = '2';  // Zutaten aller Baseline-Rezepte neu laden
const PHOTO_VERSION = '4';        // Foto-URLs aller Baseline-Rezepte neu laden
```

**Exportierte Funktionen:**

```typescript
// Startup-Migrationen (werden in _layout.tsx aufgerufen)
seedIfEmpty(): Promise<void>
patchBaselineIngredients(): Promise<void>
patchBaselinePhotos(): Promise<void>

// CRUD
getAllRecipes(): Promise<Recipe[]>           // Alphabetisch sortiert (de)
getRecipeById(id: string): Promise<Recipe | null>
saveRecipe(recipe: Recipe): Promise<void>   // Erstellt oder aktualisiert (nach ID)
deleteRecipe(id: string): Promise<void>     // Löscht Rezept + Foto
setRecipeRating(id: string, rating: number | undefined): Promise<void>
createId(): string                          // Generiert neue eindeutige ID

// Foto-Handling
saveRecipePhoto(recipeId: string, compressedUri: string): Promise<string>
deleteRecipePhoto(recipeId: string): Promise<void>

// Hilfsfunktionen
buildTeaser(recipe: Recipe): RecipeTeaser  // { attrs, ingredients } für Karten
exportRecipesJSON(): Promise<string>       // JSON ohne Foto-Pfade
importRecipesJSON(json: string): Promise<ImportResult>  // Merge nach ID

// Konstanten
RECIPE_TABS: string[]                      // Kategorie-Liste für UI
```

### 7.2 `plannerStore.ts`

```typescript
// Lesen / Schreiben
getWeekPlan(): Promise<WeekPlan>
setMeal(date: string, slot: MealSlot, meal: PlannedMeal | null): Promise<void>

// Datum-Hilfsfunktionen
weekStart(date: Date): Date                // Montag der Woche
toDateKey(date: Date): string             // → "YYYY-MM-DD"
addDays(date: Date, n: number): Date

// Statistiken & Queries
getCookDatesForRecipe(recipeId: string, days: number): Promise<string[]>
getCookCountsLastNDays(days: number): Promise<Record<string, number>>
getWeekStats(): Promise<{ days: number; meals: number }>

// Konstanten
WEEKDAYS: string[]       // ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']
WEEKDAYS_LONG: string[]  // ['Montag', 'Dienstag', ...]
COLD_MEAL_DEFAULTS: Record<MealSlot, Nutrition>
```

### 7.3 `shoppingList.ts`

```typescript
// Kern-Funktion
buildShoppingList(
  weekPlan: WeekPlan,
  recipeMap: Record<string, Recipe>
): ShoppingList

// Hilfsfunktionen
scaleAmount(amount: string, factor: number): string
shoppingListToText(list: ShoppingList): string

// Konstanten
CATEGORY_ORDER: string[]  // Sortierreihenfolge der Kategorien
```

**`scaleAmount` im Detail:**

```typescript
scaleAmount("200 g", 1.5)   // → "300 g"
scaleAmount("2 EL", 2)      // → "4 EL"
scaleAmount("½ TL", 2)      // → "1 TL"
scaleAmount("Salz", 2)      // → "Salz" (unparsierbar → Original)
scaleAmount("400 g", 1)     // Nicht aufrufen! In [id].tsx: factor === 1 → Original anzeigen
```

### 7.4 `nutritionGoals.ts`

```typescript
getNutritionGoals(): Promise<NutritionGoals>   // Fehlende Felder mit Defaults ergänzt
saveNutritionGoals(goals: NutritionGoals): Promise<void>

DEFAULT_GOALS: NutritionGoals  // kcal: 2000, protein: 75, carbs: 250, fat: 70
```

### 7.5 `settingsStore.ts`

```typescript
getSettings(): Promise<AppSettings>
saveSettings(settings: AppSettings): Promise<void>

requestNotificationPermission(): Promise<boolean>
scheduleReminder(settings: AppSettings): Promise<void>
cancelReminder(): Promise<void>

WEEKDAY_LABELS: string[]   // ['Sonntag', 'Montag', ...]
DEFAULT_SETTINGS: AppSettings
```

**Hinweis Wochentag-Offset:** JS nutzt 0=Sonntag, expo-notifications nutzt 1=Sonntag. Die App addiert intern +1 beim Scheduling.

### 7.6 `recipePicker.ts`

Schlanke In-Memory-Brücke zwischen Planer und Picker-Modal:

```typescript
type PickCallback = (recipeId: string, portions: number) => Promise<void>;

registerPickCallback(cb: PickCallback): void
completePick(recipeId: string, portions: number): void   // ruft registrierten Callback auf
cancelPick(): void                                        // setzt Callback zurück
```

**Ablauf:**
1. `planer.tsx` registriert Callback: `registerPickCallback(async (id, portions) => { await setMeal(...) })`
2. `planer.tsx` navigiert zu `/recipe/pick`
3. `pick.tsx` ruft `completePick(id, portions)` auf
4. Callback feuert → `planer.tsx` aktualisiert den Plan
5. `router.back()` schließt Picker

---

## 8. Screen-Referenz

### `app/(tabs)/index.tsx` — Home

**State:**
- `recipes: Recipe[]` — alle Rezepte
- `stats: { days, meals }` — Wochenstatistik

**Hooks:**
- `useFocusEffect(useCallback(...))` — Daten bei jedem Tab-Fokus neu laden

**Besonderheiten:**
- „Rezept des Tages": `recipes.slice(0, 10)` → zufälliger Index via `Math.floor(Math.random() * ...)` (wechselt bei jedem Fokus)
- Wochenbadge-Logik: Schwellwerte bei `days >= 6 || meals >= 10` (Tier 2) und `days >= 2 || meals >= 4` (Tier 1)

---

### `app/(tabs)/rezepte.tsx` — Rezeptliste

**State:**
- `recipes: Recipe[]` — alle Rezepte (geladen via `getAllRecipes()`)
- `cookCounts: Record<string, number>` — Kochzähler aus `getCookCountsLastNDays(28)`
- `search: string`, `activeCategory: string`, `activeFilters: string[]`
- `filtered: Recipe[]` — berechnetes Derivat

**Filter-Pipeline** (in dieser Reihenfolge):
1. Kategorie-Tab
2. Suchtext (title, description, ingredients, categories)
3. Aktive Filterchips

**Filterchip-Logik:**

```typescript
const FILTER_CHIPS = [
  { id: 'schnell',     label: 'Schnell',       fn: (r) => r.cookTime <= 25 },
  { id: 'einfach',     label: 'Einfach',       fn: (r) => r.ingredients.length <= 6 && r.cookTime <= 30 },
  { id: 'highprotein', label: 'High-Protein',  fn: (r) => (r.nutrition.protein ?? 0) / r.portions >= 25 },
  { id: 'lowcarb',     label: 'Low-Carb',      fn: (r) => (r.nutrition.carbs ?? Infinity) / r.portions < 20 },
  { id: 'lowkcal',     label: 'Low-Kalorie',   fn: (r) => (r.nutrition.kcal ?? Infinity) / r.portions < 400 },
];
```

---

### `app/(tabs)/planer.tsx` — Wochenplaner

**State:**
- `weekOffset: number` — 0 = diese Woche, 1 = nächste, −1 = letzte
- `weekPlan: WeekPlan`
- `recipeMap: Record<string, Recipe>` — alle Rezepte als Map für O(1)-Zugriff
- `goals: NutritionGoals`
- Modals: `plannerModal`, `coldMealModal` (jeweils mit Formular-State)

**Tages-Nährwert-Berechnung:**

```typescript
function calcDayNutrition(dayPlan: DayPlan): Nutrition {
  // Summiert Nährwerte aus Recipe-Mahlzeiten (skaliert nach Portionen)
  // + manuelle Einträge (manualNutrition direkt)
  // Gibt null für Felder zurück, bei denen keine Daten vorhanden sind
}
```

**Rezept-Picker-Integration:**

```typescript
// Beim Antippen von "Rezept" in einem Slot:
registerPickCallback(async (recipeId, portions) => {
  await setMeal(dateKey, slot, { recipeId, portions });
  reloadWeekPlan();
});
router.push('/recipe/pick');
```

---

### `app/(tabs)/two.tsx` — Einkaufsliste

**State:**
- `selectedDates: string[]` — welche Wochentage einbezogen werden
- `checkedItems: Map<string, boolean>` — (kategorie+name → checked)
- `ownedItems: Map<string, boolean>` — (kategorie+name → owned)
- `expandedCategories: Set<string>`
- `viewMode: 'prep' | 'shopping'`

**Daten-Flow:**
1. `getWeekPlan()` → alle Daten
2. Filtere nach `selectedDates`
3. `buildShoppingList(filteredPlan, recipeMap)` → gruppierte Liste
4. Checkmarks werden in AsyncStorage persistiert

**Item-Key-Konvention:** `${shopCategory}__${itemName.toLowerCase()}` — ermöglicht kategorie-unabhängige Suche.

---

### `app/recipe/[id].tsx` — Detailansicht

**State:**
- `recipe: Recipe | null`
- `cookDates: string[]` — letzte Kochdaten
- `scaledPortions: number` — für Live-Skalierung (initial = recipe.portions)
- `ratingModal: boolean`
- Modal-State für Planer-Hinzufügen

**Portions-Skalierung:**

```typescript
const factor = scaledPortions / (recipe.portions || 1);
const displayAmount = factor === 1 ? ing.amount : scaleAmount(ing.amount, factor);
```

> `factor === 1` → Original anzeigen (verhindert Rounding-Artefakte bei z.B. „Prise Salz")

**Header-Stack-Actions** (über `navigation.setOptions`):

```typescript
useEffect(() => {
  navigation.setOptions({
    headerRight: () => (
      <>
        <TouchableOpacity onPress={() => router.push(`/recipe/edit/${id}`)}>...</TouchableOpacity>
        <TouchableOpacity onPress={handleDelete}>...</TouchableOpacity>
      </>
    ),
  });
}, [recipe]);
```

---

### `app/recipe/new.tsx` und `app/recipe/edit/[id].tsx`

Beide sind dünne Wrapper um `RecipeForm`:

```typescript
// new.tsx
export default function NewRecipeScreen() {
  return <RecipeForm title="Neues Rezept" />;
}

// edit/[id].tsx
export default function EditRecipeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  useEffect(() => { getRecipeById(id).then(setRecipe); }, [id]);
  if (!recipe) return <ActivityIndicator />;
  return <RecipeForm initial={recipe} title="Rezept bearbeiten" />;
}
```

---

### `app/recipe/pick.tsx` — Rezept-Picker Modal

Analog zu `rezepte.tsx`, aber mit:
- Vollbild-Modal-Darstellung (kein Tab-Wrapper)
- Portionsspinner pro Rezept (lokaler State `portionsMap`)
- „Wählen"-Button ruft `completePick(recipeId, portions)` auf

---

### `app/tools.tsx` — Export / Import

**Export (Native):**
```typescript
const json = await exportRecipesJSON();
const path = FileSystem.documentDirectory + 'kochwelt-rezepte.json';
await FileSystem.writeAsStringAsync(path, json);
await Sharing.shareAsync(path, { mimeType: 'application/json' });
```

**Export (Web):**
```typescript
const blob = new Blob([json], { type: 'application/json' });
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url; a.download = 'kochwelt-rezepte.json'; a.click();
```

**Import:**
```typescript
const result = await DocumentPicker.getDocumentAsync({ type: 'application/json' });
const content = await FileSystem.readAsStringAsync(result.assets[0].uri);
const importResult = await importRecipesJSON(content);
```

---

## 9. Komponenten

### `RecipeForm.tsx`

**Props:**
```typescript
interface RecipeFormProps {
  initial?: Recipe;     // vorhanden = Edit-Modus; fehlt = Create-Modus
  title: string;        // Wird als Screen-Titel verwendet
}
```

**Zutaten-Parser:**

```typescript
// Erkennt: "200 g Mehl", "2 EL Olivenöl", "½ TL Salz"
// Unterstützt: ½ ¼ ¾ ⅓ ⅔ als Bruchzeichen
// Einheiten: g, kg, ml, l, EL, TL, Stk., Prise, Bund, ...
// Fallback: Zeile wird als Name ohne Menge gespeichert
function parseIngredients(text: string): Ingredient[]
```

**Automatische Kategorie-Zuweisung (Dictionary-Lookup):**

```typescript
const DICT: Record<string, string> = {
  // Gemüse & Obst
  'tomate': 'Gemüse & Obst', 'karotte': 'Gemüse & Obst', 'zwiebel': 'Gemüse & Obst',
  // ... ca. 80 Einträge
  // Mopro
  'butter': 'Mopro', 'sahne': 'Mopro', 'käse': 'Mopro', 'milch': 'Mopro',
  // Trockensortiment
  'mehl': 'Trockensortiment', 'nudel': 'Trockensortiment', 'reis': 'Trockensortiment',
  // ...
};
// Lookup per Substring: name.toLowerCase().includes(key)
```

**URL-Import-Ablauf:**
1. Fetch URL als HTML-Text
2. Regex-Extraktion des `application/ld+json`-Blocks
3. JSON.parse → prüfe `@type: "Recipe"`
4. Mappe `recipeIngredient`, `recipeInstructions`, `cookTime` (ISO 8601 → Minuten), `nutrition`
5. Befülle Formularfelder

**Foto-Aufnahme-Ablauf:**
1. `expo-image-picker` → URI
2. `ImageManipulator.manipulateAsync(uri, [{ resize: { width: 800 } }], { compress: 0.7, format: 'jpeg' })`
3. `saveRecipePhoto(recipeId, compressedUri)` → kopiert in PHOTO_DIR

---

### `RecipeImage.tsx`

```typescript
interface RecipeImageProps {
  uri?: string;                             // Lokaler Pfad oder https-URL
  style?: StyleProp<ImageStyle>;
  resizeMode?: 'cover' | 'contain' | 'stretch';
}
```

Verhalten:
- Rendert `<Image source={{ uri }}>` 
- Bei fehlendem `uri` oder `onError`: zeigt `assets/images/food-fallback.jpg`
- Einmal fehlgeschlagene URIs merkt sich die Komponente intern (verhindert Loop)

---

## 10. Basis-Rezepte & Migrations-System

### Struktur in `constants/baselineRecipes.ts`

```typescript
// Separate Photo-Map (wird für PHOTO-Migration genutzt)
const BASELINE_PHOTO_MAP: Record<string, string> = {
  'r_1772621457909_vw1wd': 'https://images.unsplash.com/photo-...?w=800&q=80',
  // 40 Einträge
};

export const BASELINE_RECIPES: Recipe[] = [
  {
    id: 'r_1772621457909_vw1wd',   // Stabile ID — nie ändern!
    title: 'Porreetorte ...',
    categories: ['Vegetarisch'],
    // ...
  },
];
```

> **Kritisch:** Baseline-IDs sind stabile Bezeichner. Ändere sie nie — sie werden als Schlüssel für Migrationen und die Foto-Map verwendet.

### Neue Migrations-Version auslösen

**Zutaten einer Baseline korrigieren:**
1. Ändere das Rezept in `constants/baselineRecipes.ts`
2. Erhöhe `INGREDIENTS_VERSION` in `services/recipeStore.ts` (z. B. `'2'` → `'3'`)
3. Beim nächsten App-Start: `patchBaselineIngredients()` überschreibt `ingredients` + `portions` aller Baseline-Rezepte bei bestehenden Nutzern

**Foto-URL eines Baseline-Rezepts ändern:**
1. Passe `BASELINE_PHOTO_MAP[id]` in `constants/baselineRecipes.ts` an
2. Erhöhe `PHOTO_VERSION` in `services/recipeStore.ts`

### Migrations-Schutz für Nutzer-Rezepte

Nutzer-eigene Rezepte haben IDs im Format `r_<timestamp>_<random>` — diese sind nie in `BASELINE_PHOTO_MAP` und nie in `BASELINE_RECIPES` enthalten. Beide Patch-Funktionen prüfen via `.get(r.id)` auf Zugehörigkeit zur Baseline und überspringen unbekannte IDs.

### Zutaten-Update-Skript

Für Bulk-Updates der Baseline-Zutaten wurde das Skript `/tmp/update_baseline_ingredients.js` verwendet. Als Referenz für künftige Bulk-Edits:

```javascript
// Ablauf:
// 1. baselineRecipes.ts einlesen
// 2. JSON-Array zwischen "BASELINE_RECIPES = [" und dem schließenden "];" extrahieren
// 3. JSON.parse → Array modifizieren
// 4. JSON.stringify(array, null, 2) → Datei zurückschreiben
```

---

## 11. Styling-Konventionen

### StyleSheet vs. NativeWind

Das Projekt verwendet überwiegend `React Native StyleSheet` (inline, screen-spezifisch). NativeWind v4 ist installiert, wird aber nur vereinzelt für Utility-Klassen eingesetzt.

### Farbpalette

```typescript
const COLORS = {
  primary:      '#f97316',  // Orange — Haupt-CTA, Badges
  primaryLight: '#fff7ed',  // Orange-50 — Chip-Hintergrund
  bg:           '#f5f5f4',  // Stone-50 — App-Hintergrund
  card:         '#ffffff',  // Weiß — Karten
  textDark:     '#1c1917',  // Stone-900 — Haupttext
  textMid:      '#57534e',  // Stone-600 — Sekundärtext
  textLight:    '#a8a29e',  // Stone-400 — Platzhalter
  border:       '#e7e5e4',  // Stone-200 — Trennlinien
  green:        '#22c55e',  // Erfolg, Checkmarks
  red:          '#ef4444',  // Fehler, Löschen
  blue:         '#3b82f6',  // Kalte Küche
};
```

### Chip-Pattern

Chips (Kategorie-Badges, Meta-Informationen) folgen diesem Schema:

```typescript
const chipStyle = {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 4,
  paddingHorizontal: 8,
  paddingVertical: 4,
  backgroundColor: '#fff7ed',
  borderRadius: 12,
};
```

### Skalierung / Screen-Größen

Keine Responsive-Breakpoints — die App ist ausschließlich für Portrait-Modus (mobile) konzipiert. Breiten werden mit `'100%'` oder berechneten Werten gesetzt, keine fixen Pixel.

---

## 12. Bekannte Einschränkungen & Plattform-Unterschiede

### Web (expo start --web)

| Feature | Status |
|---|---|
| Foto hochladen | Nicht unterstützt (`expo-file-system` nicht auf Web) |
| Foto anzeigen (https-URLs) | Funktioniert |
| Export | Funktioniert (Blob-Download) |
| Import | Funktioniert (native file input) |
| Benachrichtigungen | Nicht unterstützt |
| AsyncStorage | Funktioniert (localStorage-basiert) |

### iOS

- Expo Go inkompatibel mit iOS 18+ (Simulator benötigt Xcode)
- Für physische Geräte: Development Build via EAS erforderlich
- Benachrichtigungen: Permission-Dialog erscheint beim ersten Aktivieren

### Allgemein

- Kein Offline-Fallback für URL-Import (benötigt Netzwerk)
- `scaleAmount` funktioniert nicht bei rein textuellen Mengen wie „nach Belieben" — gibt den Originalstring zurück

---

## 13. Roadmap & Erweiterungspunkte

### Nährwert-Charts

- Neuer Tab oder Screen unter `/einstellungen`
- Datenquelle: `getWeekPlan()` über mehrere Wochen → aggregieren
- Chart-Bibliothek: `victory-native` oder `react-native-chart-kit`
- Zeige: kcal/Protein/Carbs/Fett als Wochendurchschnitt und Tagesverteilung

### Cloud-Sync (Supabase)

Empfohlene Architektur:
1. Supabase Auth → Nutzerkonten
2. PostgreSQL-Tabellen: `recipes`, `week_plans`
3. Row-Level Security: jeder Nutzer sieht nur seine Daten
4. Sync-Strategie: lokale Änderungen mit Timestamp → beim Öffnen Merge mit Server (Last-Write-Wins oder Conflict-UI)

### Push-Erinnerungen (erweitern)

Aktuell: eine Wochenerinnerung. Erweiterbar auf:
- Tägliche Kochen-Erinnerung wenn Rezept im Plan
- Einkaufslisten-Erinnerung basierend auf geplantem Einkaufstag

### Rezept-Bewertungs-Statistik

- Eigener View: Rezepte sortiert nach Rating
- Filter-Chip: `★★★★★` (nur bewertete Rezepte)
- Durchschnitts-Rating auf Übersichtsseite

### Neue Kategorie-Typen

`RECIPE_TABS` in `recipeStore.ts` erweitern:

```typescript
export const RECIPE_TABS = [
  'Alle', 'Pasta', 'Reis', ..., 'Dessert', 'Frühstück',  // neue hinzufügen
];
```

### Tests erweitern

Aktuell nur Unit-Tests für Services. Empfehlung:
- Integration-Tests mit `@testing-library/react-native`
- Snapshot-Tests für Recipe-Card und RecipeForm
- E2E-Tests mit Maestro oder Detox
