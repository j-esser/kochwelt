# Kochwelt

Persönliche Rezept- und Meal-Planning-App für iOS und Android, entwickelt mit Expo (React Native).

---

## Features

### Rezeptverwaltung
- Alle Rezepte auf einen Blick mit Suchfunktion und Kategorie-Filtertabs
- Detailansicht: Zutaten, Zubereitung, Nährwerte (kcal/Port., Eiweiß, Fett, Kohlenhydrate), Kochzeit, Portionen
- Rezepte erstellen, bearbeiten und löschen
- Kategorien als Tags (Pasta, Reis, Curry, Suppe, Fisch, Fleisch, Vegetarisch, Salat, Eintopf)
- 40 Basis-Rezepte werden beim ersten Start automatisch geladen

### Wochenplaner
- 7-Tage-Übersicht (Montag–Sonntag) mit Mittag- und Abend-Slots
- Rezept pro Slot auswählen, Portionszahl anpassen
- Mahlzeit per Tap auf das ×-Symbol entfernen
- Wochenwechsel (vor/zurück) mit Datumsanzeige
- Kalorienanzeige pro Portion je Mahlzeit und Wochensumme (kcal/Port.)

### Einkaufsliste
- Wird automatisch aus dem Wochenplan generiert
- Zutaten werden portionsskaliert zusammengefasst
- Gruppierung nach Einkaufskategorien (Gemüse & Obst, Fleisch & Fisch, Mopro, Trockensortiment, Tiefkühl, Vorrat, Sonstiges)
- Checkboxen zum Abhaken, Fortschrittsbalken
- Kategorien ein-/ausklappbar
- Einkaufsliste als Text teilen (iOS/Android Share-Sheet)

### Startseite
- Begrüßung je Tageszeit
- Rezeptestatistiken auf einen Blick
- "Rezept des Tages" als Featured Card
- Schnellzugriff auf zuletzt hinzugefügte Rezepte

---

## Tech-Stack

| Schicht | Technologie |
|---|---|
| Framework | Expo (React Native) mit Expo Router |
| Navigation | File-based Stack + Tab Navigation |
| UI-Komponenten | React Native StyleSheet + Ionicons |
| Datenpersistenz | AsyncStorage (lokal, offline-first) |
| Sprache | TypeScript |

---

## Projektstruktur

```
kochwelt/
├── app/
│   ├── (tabs)/
│   │   ├── index.tsx          # Startseite
│   │   ├── rezepte.tsx        # Rezeptliste mit Suche & Kategoriefilter
│   │   ├── planer.tsx         # Wochenplaner
│   │   └── two.tsx            # Einkaufsliste
│   ├── recipe/
│   │   ├── [id].tsx           # Rezept-Detailansicht
│   │   ├── new.tsx            # Neues Rezept erstellen
│   │   └── edit/[id].tsx      # Rezept bearbeiten
│   └── _layout.tsx            # Root-Layout (SafeAreaProvider, Stack)
├── services/
│   ├── recipeStore.ts         # Rezept-CRUD mit AsyncStorage
│   ├── plannerStore.ts        # Wochenplan-Verwaltung
│   └── shoppingList.ts        # Einkaufslisten-Logik (Skalierung, Gruppierung)
├── constants/
│   └── baselineRecipes.ts     # 40 Basis-Rezepte (Seed-Daten)
└── app.json                   # Expo-Konfiguration
```

---

## Lokale Entwicklung

### Voraussetzungen
- Node.js v18+
- Xcode (für iOS Simulator)
- Android Studio (für Android Emulator)

### Setup

```bash
# Repository klonen
git clone git@github.com:j-esser/kochwelt.git
cd kochwelt

# Abhängigkeiten installieren
npm install

# Entwicklungsserver starten
npx expo start
```

Im Terminal dann `i` für iOS Simulator oder `a` für Android drücken.

> **Hinweis**: Expo Go ist mit iOS 18+ nicht kompatibel. Für den iOS-Simulator wird Xcode benötigt.

---

## Datenmodell

### Recipe
```typescript
{
  id: string;
  title: string;
  description: string;
  cookTime: number;           // Minuten
  portions: number;
  categories: string[];
  ingredients: Ingredient[];
  nutrition: {
    kcal: number | null;      // Gesamtwert für alle Portionen
    protein: number | null;
    fat: number | null;
    carbs: number | null;
  };
  reference: string;          // URL oder Buchquelle
}
```

### Ingredient
```typescript
{
  name: string;
  amount: string;             // z.B. "200 g", "2 EL"
  shopCategory: string;       // Einkaufskategorie
}
```

### WeekPlan
```typescript
Record<"YYYY-MM-DD", {
  mittag?: { recipeId: string; portions: number };
  abend?:  { recipeId: string; portions: number };
}>
```

---

## Roadmap

### Phase 2 (geplant)
- Nährwert-Statistiken (wöchentliche/monatliche Charts)
- Rezept-Bewertung (1–5 Sterne)
- Push-Erinnerungen (Einkaufen, Kochen)
- Import via URL (Chefkoch, etc.)
- Foto pro Rezept

### Phase 3 (langfristig)
- Cloud-Sync (Supabase)
- Benutzerkonten und Rezepte teilen
- Community-Features

---

## Deployment (TestFlight / App Store)

```bash
# EAS CLI installieren
npm install -g eas-cli
eas login

# Build konfigurieren (einmalig)
eas build:configure

# iOS Build erstellen
eas build --platform ios

# Android Build erstellen
eas build --platform android
```

Für die Veröffentlichung im App Store wird ein [Apple Developer Account](https://developer.apple.com) (99 $/Jahr) benötigt.
Für Google Play ein [Google Play Developer Account](https://play.google.com/console) (25 $ einmalig).
