# Kochwelt

Persönliche Rezept- und Meal-Planning-App für iOS und Android, entwickelt mit Expo (React Native).

Die App erkennt Zutaten automatisch, berechnet Nährwerte aus den Mengen, fasst Einkaufslisten intelligent zusammen und liefert über einen leichtgewichtigen Sync-Mechanismus regelmäßig Updates an die Zutaten-Datenbank — ganz ohne App-Update.

---

## Features

### Rezeptverwaltung
- Alle Rezepte auf einen Blick mit **tippfehler-toleranter Suche** (Fuse.js) und Kategorie-Filtertabs
- Smart-Filter: Schnell, Einfach, High-Protein, Low-Carb, Low-Kalorie
- Detailansicht: Zutaten, Zubereitung, Nährwerte, Kochzeit, Portionen
- **Live-Portionsskalierung**: +/− Buttons skalieren alle Zutatenmengen in Echtzeit
- Persönliche Bewertung (1–5 Sterne)
- **Koch-Zähler**: Badge „X× in 4 Wochen" zeigt, wie oft ein Rezept zuletzt eingeplant war
- Foto pro Rezept (Kamera oder Galerie), gespeichert lokal
- 40 kuratierte Basis-Rezepte beim ersten Start (mit aus den Zutaten berechneten Nährwerten)
- Kategorien: Pasta, Reis, Curry, Suppe, Fisch, Fleisch, Vegetarisch, Salat, Eintopf

### Smarte Zutaten-Erkennung
- Beim Eingeben werden Zutaten gegen eine zentrale Datenbank (ca. 108 Einträge) abgeglichen
- ✅-Chips für bekannte, ⚠️-Chips für unbekannte Zutaten direkt im Formular
- Sammeldialog beim Speichern: unbekannte Zutaten einmal pflegen, danach kennt die App sie immer
- **Mehrzeiliges Format wird erkannt**: Imports wie „75 g" / „Schinkenwürfel" auf separaten Zeilen werden zusammengeführt; Anmerkungen wie „à ca. 200 g" ausgeblendet

### Nährwerte aus Zutaten berechnen
- Button „Aus Zutaten berechnen" im Rezept-Formular zeigt eine Vorschau (z.B. „620 kcal · 16 g Eiweiß · 8/9 Zutaten erkannt")
- Bei „Übernehmen" werden die Felder gefüllt — manuelle Werte werden NIE ohne Klick überschrieben

### Wochenplaner
- 7-Tage-Übersicht (Montag–Sonntag) mit Mittag- und Abend-Slots, plus beliebig viele Snacks
- Rezept pro Slot auswählen, Portionszahl anpassen
- Kalte Küche & Snacks mit Mahlzeit-Typ-Vorbelegung (Frühstück / Mittag / Abend / Snack)
- Tagesziel-Fortschrittsbalken (Kalorien, Eiweiß, Kohlenhydrate, Fett) mit Farbcode
- Wochen-Navigation vor und zurück

### Klügere Einkaufsliste
- Wird automatisch aus dem Wochenplan generiert (inkl. Snacks)
- **Aggregation per Zutaten-ID**: gleiche Zutat aus mehreren Rezepten landet in einer Zeile
- **Einheiten werden umgerechnet**: „2 EL" + „100 ml" + „1 Schuss" → „130 ml Olivenöl (2 EL + 100 ml + 1 Schuss)"
- **Stückzahlen werden mitgewogen**: 3 Tomaten + 200 g Tomaten → 560 g Tomaten
- **Tagesauswahl**: Nur ausgewählte Wochentage fließen in die Liste ein (ideal für 2× Einkaufen pro Woche)
- Gruppierung nach Einkaufskategorien (Gemüse & Obst, Fleisch & Fisch, Mopro, Trockensortiment, Tiefkühl, Vorrat, Sonstiges)
- Checkboxen mit persistentem Stand, Fortschrittsbalken, Kategorien ein-/ausklappbar
- **Teilen als Text** (WhatsApp, Mail, AirDrop) oder **als .ics-Datei** (iOS Reminders)

### Import & Export
- **URL-Import**: Rezept direkt aus Chefkoch & Co. importieren (JSON-LD-Parser, kein Server)
- **Clipboard-Erkennung**: URL kopieren → Kochwelt öffnen → Import wird automatisch angeboten
- **JSON-Datei-Import**: Rezeptdaten via Datei-Picker einlesen
- **Vorlage-Modal**: Beispiel-Vorlage oder „Aus Rezept duplizieren"
- **Android Share Sheet**: Kochwelt erscheint nativ beim Teilen aus Chrome/Firefox
- **Einzel-Rezept teilen**: Rezept als kompakte JSON-Datei via Mail/AirDrop/Messages versenden
- **Voll-Export/Import** aller Rezepte als JSON

### Live-Updates der Zutaten-Datenbank (ab 1.4)
- Beim App-Start prüft Kochwelt im Hintergrund (max. einmal pro 6 Stunden), ob eine neuere Version der Baseline verfügbar ist — Source: GitHub Gist
- Korrekturen, neue Zutaten und neue Aliase landen automatisch in der App, ohne App-Update
- Status + manueller Refresh unter *Einstellungen → Zutaten-Datenbank*
- Eigene Daten bleiben unangetastet — nur die Baseline-Liste wird ergänzt oder korrigiert

### Geschenk-Rezepte (ab 1.5)
- Ab und zu landet ein kuratiertes neues Rezept als Geschenk in deiner Sammlung
- Orange Banner in der Rezepte-Liste weist auf neue Geschenke hin (Tap = öffnen, X = wegklicken)
- Geschenk-Rezepte sind ganz normale Rezepte — editierbar, löschbar, in den Wochenplan ziehbar
- Toggle in den Einstellungen, jederzeit deaktivierbar
- **Eigenes Rezept einsenden**: Lieblingsrezept auswählen → Mail-App öffnet sich mit fertiger Vorschlags-Mail (kein Account, kein Setup)

### Tipps & Tricks
- `?`-Icon auf jedem Screen öffnet kontextspezifische Hinweise
- Zentrale Übersicht aller Tipps unter *Einstellungen → Tipps & Tricks*
- Plattform-Filter (iOS-only Hinweise erscheinen nur dort)

### Startseite
- Begrüßung je Tageszeit
- Wochenstatistik (geplante Mahlzeiten, Tage)
- „Rezept des Tages" als Featured Card

---

## Tech-Stack

| Schicht | Technologie |
|---|---|
| Framework | Expo SDK 55 (React Native) mit Expo Router |
| Navigation | File-based Stack + Tab Navigation |
| Styling | NativeWind v4 + React Native StyleSheet |
| UI-Icons | Ionicons (`@expo/vector-icons`) |
| Suche | Fuse.js (Tippfehler-tolerant) |
| Datenpersistenz | AsyncStorage (lokal, offline-first) |
| Remote-Sync | GitHub Gists (Zutaten-DB + Geschenk-Rezepte) |
| Sprache | TypeScript |
| Build & Release | EAS Build + TestFlight |

---

## Projektstruktur

```
kochwelt/
├── app/
│   ├── (tabs)/
│   │   ├── index.tsx              # Startseite
│   │   ├── rezepte.tsx            # Rezeptliste mit Suche, Filtern, Geschenk-Banner
│   │   ├── planer.tsx             # Wochenplaner
│   │   ├── two.tsx                # Einkaufsliste
│   │   └── einstellungen.tsx      # Tipps, Goals, Sync-Status, Geschenk-Toggle
│   ├── recipe/
│   │   ├── [id].tsx               # Rezept-Detailansicht
│   │   ├── new.tsx                # Neues Rezept (mit ?importUrl=)
│   │   ├── edit/[id].tsx          # Rezept bearbeiten
│   │   └── pick.tsx               # Rezept-Picker (Modal, für Planer)
│   ├── tools.tsx                  # Voll-Export/Import JSON
│   └── _layout.tsx                # Root: Migrationen + Sync-Trigger
├── services/
│   ├── recipeStore.ts             # Rezept-CRUD, Foto-Handling, Migrationen
│   ├── plannerStore.ts            # Wochenplan-Verwaltung
│   ├── shoppingList.ts            # Baseline-bewusste Aggregation, Einheiten-Konvertierung
│   ├── nutritionGoals.ts          # Tageszielen für Kalorien/Eiweiß/Fett/KH
│   ├── settingsStore.ts           # App-Einstellungen, Erinnerungen
│   ├── recipePicker.ts            # Picker-Brücke Planer ↔ Modal
│   ├── tips.ts                    # Tipp-System
│   ├── ingredientBaseline.ts      # Parser, Matcher, Nährwert-Berechnung
│   ├── userIngredients.ts         # Persistenz für Nutzer-eigene Zutaten
│   ├── baselineSync.ts            # Gist-Sync für die Zutaten-Datenbank
│   └── giftRecipes.ts             # Gift-Sync, Banner-Queue, Submission-Mail
├── components/
│   ├── RecipeForm.tsx             # Formular mit Chip-Anzeige + Auto-Nährwerte
│   ├── RecipeImage.tsx            # Foto mit Fallback
│   ├── TipButton.tsx              # ?-Icon → öffnet TipModal
│   ├── TipModal.tsx               # Bottom-Sheet mit Tipps
│   ├── UnknownIngredientsModal.tsx # Sammeldialog beim Speichern
│   └── GiftBanner.tsx             # Geschenk-Banner für die Rezepte-Liste
├── constants/
│   ├── baselineRecipes.ts         # 40 Basis-Rezepte (versioniert migriert)
│   └── ingredientBaseline.ts      # ~108 Zutaten mit Aliasen + Nährwerten
├── scripts/                       # tsx-Helper für Audit, Export, Pflege
│   ├── auditBaselineIngredients.ts
│   ├── calcBaselineNutrition.ts
│   ├── exportBaselineForGist.ts
│   ├── addGiftRecipe.ts
│   └── parserSmokeTest.ts
├── docs/release-notes/            # Tester-Doku (HTML/DOCX/RTF/TXT)
└── app.json                       # Expo-Konfiguration
```

---

## Lokale Entwicklung

### Voraussetzungen
- Node.js v18+
- Xcode (für iOS Simulator)
- Android Studio (für Android Emulator)

### Setup

```bash
git clone git@github.com:j-esser/kochwelt.git
cd kochwelt
npm install

npx expo start --web        # Web-Vorschau (funktioniert immer)
npx expo start              # Dann 'i' für iOS Simulator (benötigt Xcode)
```

> **Hinweis**: Expo Go ist mit iOS 26+ nicht kompatibel. Für den iOS-Simulator wird Xcode benötigt.

### Helper-Scripts

```bash
# Audit der Baseline-Zutaten gegen die 40 Rezepte
npx tsx scripts/auditBaselineIngredients.ts

# Nährwerte aller Baseline-Rezepte aus den Zutaten neu berechnen
npx tsx scripts/calcBaselineNutrition.ts

# JSON für den Baseline-Gist exportieren (Version inkrementieren!)
npx tsx scripts/exportBaselineForGist.ts <version>

# Geschenk-Rezept anhängen
npx tsx scripts/addGiftRecipe.ts <recipe.json> <YYYY-MM-DD>
```

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
  photo?: string;             // Lokaler Pfad oder https-URL
  rating?: number;            // 1–5
}
```

### Ingredient
```typescript
{
  name: string;
  amount: string;             // z.B. "200 g", "2 EL", "½ TL"
  shopCategory: string;       // Einkaufskategorie
  baselineId?: string;        // Referenz auf BaselineIngredient.id
  parsedQuantity?: number;    // numerische Menge
  parsedUnit?: string;        // normalisierte Einheit ("g", "EL", …)
}
```

### BaselineIngredient
```typescript
{
  id: string;
  name: string;
  aliases?: string[];
  category: 'Gemüse & Obst' | 'Fleisch & Fisch' | 'Mopro'
          | 'Trockensortiment' | 'Tiefkühl' | 'Vorrat' | 'Sonstiges';
  base_unit: 'g' | 'ml' | 'Stück';
  default_weight_per_piece?: number;
  default_weight_per_unit?: Record<string, number>;  // 'EL': 15, 'Dose': 400, ...
  nutrients_per_100g?: { calories, protein, fat, carbs };
  nutrients_per_100ml?: { calories, protein, fat, carbs };
}
```

### WeekPlan
```typescript
Record<"YYYY-MM-DD", {
  mittag?: { recipeId?: string; portions: number; ... };
  abend?:  { recipeId?: string; portions: number; ... };
  snacks?: { recipeId?: string; portions: number; ... }[];
}>
```

---

## Roadmap

### Erledigt seit 1.2
- ✅ Smarte Zutaten-Erkennung mit Chip-Anzeige (1.3)
- ✅ Auto-Nährwert-Berechnung aus Zutaten (1.3)
- ✅ Baseline-bewusste Einkaufslisten-Aggregation (1.3)
- ✅ Tippfehler-tolerante Suche (Fuse.js, 1.3)
- ✅ Live-Updates der Zutaten-Datenbank via Gist (1.4)
- ✅ Geschenk-Rezepte mit Banner und Submission-Flow (1.5)
- ✅ Android-Build & Play-Store-Einreichung (Internal Test, 1.5)
- ✅ Cold-Start-Optimierung & lokale Kategorie-Bilder (1.5.1)
- ✅ Android Share-Sheet: Rezepte aus Chrome/Chefkoch teilen → direkter Import (1.5.1, via `expo-share-intent`)
- ✅ Clipboard-Erkennung mit Rezept-Domain-Whitelist + Dedup (1.5.1)
- ✅ App-Info-Sektion in Einstellungen (Version + Build-Nummer, 1.5.1)
- ✅ Adaptive Icon mit echtem Kochwelt-Logo (1.5.1)

### In Planung
- ⏳ iOS Share Extension (nativer Safari-Share-Sheet-Eintrag)
- ⏳ Nährwert-Statistiken (wöchentliche Charts)
- ⏳ Push-Erinnerungen (Kochen-Erinnerung)
- ⏳ Cloud-Sync für User-Rezepte und eigene Zutaten (Supabase)
- ⏳ Geschenk-Submissions-Backend (wenn Volumen reicht — derzeit per Mail)

---

## Deployment (TestFlight & Play Store)

### Builds erstellen

```bash
# EAS CLI installieren
npm install -g eas-cli
eas login

# iOS Build (Production)
eas build --platform ios --profile production

# Android Build (Production)
eas build --platform android --profile production
```

Die `eas.json` nutzt `appVersionSource: "remote"` — die Versionsnummer wird zentral
auf den Expo-Servern gehalten. `expo.version` (z.&nbsp;B. `1.5.0`) kommt aus
`app.json`, der numerische `versionCode` (Android) / `buildNumber` (iOS) wird
automatisch hochgezählt. Vor dem ersten Android-Build pro Versions-Reihe ggf.
mit `eas build:version:set --platform android` initialisieren.

### Tester-Doku

| Zielsystem | Quelle |
|---|---|
| iOS / TestFlight | `docs/release-notes/Kochwelt-v<version>.{html,docx,rtf}` + Kurztext `Kochwelt-v<version>-testflight.txt` |
| Android / Play Store | `docs/play-store/listing-de.md` (Store-Texte, Release-Notes, Fragebogen-Antworten) + `PRIVACY.md`/`privacy.html` (Datenschutzerklärung) |
| Store-Grafiken | `docs/play-store/play-store-icon-512.png`, `feature-graphic.png` (Quelle: `feature-graphic.html`) |

### Account-Voraussetzungen

- iOS: [Apple Developer Account](https://developer.apple.com) (99 $/Jahr)
- Android: [Google Play Developer Account](https://play.google.com/console) (25 $ einmalig)
- Für neue Google-Play-Konten: vor erstem Production-Release ≥20 Tester über
  ≥14 Tage im Geschlossenen Test verpflichtend (Google-Regel seit Nov 2023).
