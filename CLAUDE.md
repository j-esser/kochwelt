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
    einstellungen.tsx # Einstellungen: Nährwertziele, Export/Import-Link
    _layout.tsx       # Tab-Navigation Konfiguration
  recipe/
    [id].tsx          # Detailansicht: Zutaten, Nährwerte, Rating, Portionsskalierung
    new.tsx           # Neues Rezept erstellen
    edit/[id].tsx     # Rezept bearbeiten
    pick.tsx          # Modal: Rezept aus Liste auswählen (für Planer)
  tools.tsx           # Export/Import JSON
  _layout.tsx         # Root-Layout: Stack, seedIfEmpty, patchBaselineIngredients, patchBaselinePhotos
```

### Services

| Datei | Zuständigkeit |
|---|---|
| `services/recipeStore.ts` | Rezept-CRUD (AsyncStorage), Foto-Handling, Seed, Migrations |
| `services/plannerStore.ts` | Wochenplan lesen/schreiben |
| `services/shoppingList.ts` | Einkaufsliste aufbauen, `scaleAmount()` |
| `services/nutritionGoals.ts` | Nährwertziele (Tagesziele, AsyncStorage) |
| `services/recipePicker.ts` | Hilfsfunktionen für Rezept-Auswahl |
| `services/settingsStore.ts` | App-Einstellungen |

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
  amount: string;       // "200 g", "2 EL", "½ TL" — unicode-Brüche erlaubt
  shopCategory: string; // siehe Einkaufskategorien unten
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

1. **`seedIfEmpty()`** — lädt 40 Basis-Rezepte beim allerersten Start (nur wenn AsyncStorage leer)
2. **`patchBaselineIngredients()`** — überschreibt `ingredients` + `portions` aller Baseline-Rezepte wenn `INGREDIENTS_VERSION` veraltet (Key: `kochwelt_ingredients_version`)
3. **`patchBaselinePhotos()`** — aktualisiert Foto-URLs aller Baseline-Rezepte wenn `PHOTO_VERSION` veraltet (Key: `kochwelt_photo_version`)

**Versionsnummern erhöhen um Migration auszulösen:**
- Zutaten-Änderungen an Baseline → `INGREDIENTS_VERSION` in `recipeStore.ts` erhöhen
- Foto-URL-Änderungen → `PHOTO_VERSION` erhöhen

---

## Basis-Rezepte (`constants/baselineRecipes.ts`)

- 40 Rezepte, versioniert migrierbar
- IDs sind stabile Strings (z.B. `"bolognese"`, `"linseneintopf"`)
- `BASELINE_PHOTO_MAP`: separate Map mit Unsplash-URLs (Foto-Patches)
- Nutzer-eigene Rezepte haben IDs im Format `r_<timestamp>_<random>` — werden von Migrationen nicht berührt

---

## Wichtige Implementierungsdetails

### `scaleAmount(amount, factor)` — `services/shoppingList.ts`
- Parst Strings wie `"200 g"`, `"2 EL"`, `"½ TL"` (unicode-Brüche werden konvertiert)
- Gibt skalierten String zurück, bei nicht-parsbarem Input den Originalstring
- In `[id].tsx` genutzt: `factor === 1` → Original anzeigen (kein Rounding-Artefakt)

### Rating — `services/recipeStore.ts`
- `setRecipeRating(id, rating | undefined)` — gleicher Stern nochmal → `undefined` (löscht Bewertung)
- Gespeichert direkt auf dem Recipe-Objekt in AsyncStorage

### Foto-Handling
- Lokale Fotos: `FileSystem.documentDirectory + 'recipe_photos/' + recipeId + '.jpg'`
- Baseline-Fotos: https-URLs aus `BASELINE_PHOTO_MAP`
- `RecipeImage.tsx`: Komponente mit Fallback auf `assets/images/food-fallback.jpg`

### Wochenplan-Key-Format
- `"YYYY-MM-DD"` (ISO-Datum des Montags der jeweiligen Woche)
- Slots: `mittag` | `abend`
- `meal.recipeId` kann `undefined` sein (leerer Slot / Kalte Küche) — immer prüfen vor Zugriff

---

## Bekannte Einschränkungen

- `FileSystem` nicht verfügbar auf Web → Foto-Upload im Web deaktiviert
- Expo Go inkompatibel mit iOS 26+ → iOS Simulator (Xcode) oder Android Emulator nutzen
- Kein Cloud-Sync — alle Daten lokal in AsyncStorage

---

## Roadmap

- ⏳ Nährwert-Statistiken (Charts)
- ⏳ Push-Erinnerungen
- ⏳ Cloud-Sync (Supabase)
