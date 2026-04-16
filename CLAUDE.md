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
    einstellungen.tsx # Einstellungen: Nährwertziele, Browser-Import-Hinweis
    _layout.tsx       # Tab-Navigation Konfiguration
  recipe/
    [id].tsx          # Detailansicht: Zutaten, Nährwerte, Rating, Portionsskalierung
    new.tsx           # Neues Rezept — liest optionalen ?importUrl= Query-Param
    edit/[id].tsx     # Rezept bearbeiten
    pick.tsx          # Modal: Rezept aus Liste auswählen (für Planer)
  tools.tsx           # Export/Import JSON
  _layout.tsx         # Root-Layout: seedIfEmpty, patchBaselineIngredients, patchBaselinePhotos
```

### Services

| Datei | Zuständigkeit |
|---|---|
| `services/recipeStore.ts` | Rezept-CRUD (AsyncStorage), Foto-Handling, Seed, Migrationen |
| `services/plannerStore.ts` | Wochenplan lesen/schreiben |
| `services/shoppingList.ts` | Einkaufsliste aufbauen, `scaleAmount()`, `shoppingListToICS()` |
| `services/nutritionGoals.ts` | Nährwertziele (Tagesziele, AsyncStorage) |
| `services/recipePicker.ts` | Callback-Brücke Planer ↔ Picker-Modal |
| `services/settingsStore.ts` | App-Einstellungen, Benachrichtigungen |

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
  shopCategory: string;
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
2. **`patchBaselineIngredients()`** — überschreibt `ingredients` + `portions` aller Baseline-Rezepte wenn `INGREDIENTS_VERSION` veraltet
3. **`patchBaselinePhotos()`** — aktualisiert Foto-URLs wenn `PHOTO_VERSION` veraltet

**Versionsnummern in `recipeStore.ts` erhöhen um Migration auszulösen.**

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

### Foto-Handling
- Lokale Fotos: `FileSystem.documentDirectory + 'recipe_photos/' + recipeId + '.jpg'`
- Baseline-Fotos: https-URLs aus `BASELINE_PHOTO_MAP`
- `RecipeImage.tsx`: Fallback auf `assets/images/food-fallback.jpg`
- Web: FileSystem nicht verfügbar → Foto-Upload deaktiviert

### Wochenplan
- Key-Format: `"YYYY-MM-DD"`
- Slots: `mittag` | `abend`
- `meal.recipeId` kann `undefined` sein (Kalte Küche / manueller Eintrag) — **immer prüfen vor Zugriff**

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
